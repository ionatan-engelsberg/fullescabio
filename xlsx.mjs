import sql from 'mssql';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
const __dirname = path.resolve();

const uploadsSource = `${__dirname}/uploads`;

const emptyUploadsDirectory = () => {
  if(!fs.existsSync(uploadsSource)){
    return
  } 
  fs.readdir(uploadsSource, (err, files) => {
    // TODO: Better handling
    if (err) return console.log('ERROR WHILE EMPTYING UPLOADS DIRECTORY: ', err)

    files.forEach((file) => {
      fs.unlink(`${uploadsSource}/${file}`, (error) => {
        if (err) return console.log('ERROR WHILE DELETING FILE: ', err)
      })
    })
  });
};

// COPIADA DE admin.mjs
const getClientById = async (clientId) => {
  const query = `EXEC may_client_busq @num = '${clientId}'`
  try {
    const request = await new sql.Request().query(query)
    return request.recordset.map((row) => {
      const { NUM_CLIENTE: id, RAZON: razon, NOM_FANTASIA: nombreFantasia, LISTA_DESCRIP: lista, VENDEDOR: vendedor, LISTA_CODI: listaCodigo } = row
      return { id, razon, nombreFantasia, lista, vendedor, listaCodigo }
    })
  } catch (error) {
    console.log('ERROR: ', error);
    return [];
  }
}

// COPIADA DE admin.mjs
const getProductBySku = async (sku, lista) => {
  const query = `EXEC may_articulos @cod_art = '${sku}', @lista_cod = ${lista}`
  try {
    const request = await new sql.Request().query(query)
    return request.recordset.map((row) => {
      const { COD_ARTICULO: codigo, DESCRIP_ARTI: nombre, PRECIO_VTA: precio } = row
      return { codigo, nombre, precio }
    })
  } catch (error) {
    console.log('ERROR: ', error);
    return [];
  }
}

const validateRow = async (row, rowCounter, sp) => {
  const { sku, cantidad, precio, cliente, descuento } = row

  if (
    !sku ||
    !cantidad ||
    !precio ||
    !descuento
  ) {
    throw new Error("Cell can't be empty", { cause: rowCounter })
  }

  if (typeof Number(cantidad) != 'number') {
    throw new Error("'Cantidad' must be a number", { cause: rowCounter })
  }
  if (typeof Number(precio) != 'number') {
    throw new Error("'Precio' must be a number", { cause: rowCounter })
  }
  if (typeof Number(descuento) != 'number') {
    throw new Error("'Descuento' must be a number", { cause: rowCounter })
  }

  let client;
  let listaCodigo;
  let product;

  if (!sp && !cliente) {
    throw new Error("Client can't be empty", { cause: rowCounter });
  }

  if (sp && !cliente) {
    return row;
  }

  const clientResult = await getClientById(cliente);
  if (clientResult.length == 0) {
    throw new Error(`Invalid client: ${cliente}`, { cause: rowCounter })
  }

  client = clientResult[0]
  const { listaCodigo: lista } = client
  listaCodigo = lista

  const productResult = await getProductBySku(sku, listaCodigo);
  if (productResult.length == 0) {
    throw new Error(`Invalid sku: ${sku}`, { cause: rowCounter })
  }
  product = productResult[0].nombre;

  row.descripcion = product;


  return row;
}

const validateWorkbook = async (file, sp) => {
  if (typeof sp != 'boolean') {
    throw new Error("Internal server error", { cause: `Invalid sp value: ${sp}` })
  }

  const { Sheets: sheets } = file;
  const sheetsNames = Object.keys(sheets);
  if (sheetsNames.length != 1) {
    throw new Error('File must have exactly one sheet');
  }

  const sheet = sheetsNames[0];
  const sheetItems = xlsx.utils.sheet_to_json(sheets[sheet]);

  if (sheetItems.length == 0) {
    throw new Error('File must have at least one row');
  }

  const parsedItems = []
  let i = 0;
  for (const item of sheetItems) {
    i += 1;
    const parsedItem = await validateRow(item, i + 1, sp);
    parsedItems.push(parsedItem);
  }

  return parsedItems;
}


export const parsedWorkbook = async (fileName, sp) => {
  const filePath = path.join(__dirname, 'uploads', fileName);
  const workbook = xlsx.readFile(filePath);
  try {
    const items = await validateWorkbook(workbook, sp);
    emptyUploadsDirectory();
    return items
  } catch (error) {
    emptyUploadsDirectory();
    const rowError = error.cause
    if (typeof rowError == 'number') {
      throw new Error(`ERROR at row ${rowError}: ${error}`)
    } else {
      throw new Error(`ERROR: ${error.cause}`)
    }
  }
}