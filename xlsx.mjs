import sql from 'mssql';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
const __dirname = path.resolve();

const uploadsSource = `${__dirname}/uploads`;

const emptyUploadsDirectory = () => {
  if (!fs.existsSync(uploadsSource)) {
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

const getClientById = async (clientId) => {
  const query = `EXEC may_client_busq @num = '${clientId}'`
  try {
    const request = await new sql.Request().query(query)
    return request.recordset.map((row) => {
      const { NUM_CLIENTE: id, RAZON: razon, NOM_FANTASIA: nombreFantasia, LISTA_DESCRIP: lista, VENDEDOR: vendedor, LISTA_CODI: listaCodigo } = row
      return { id, razon, nombreFantasia, lista, vendedor, listaCodigo }
    })
  } catch (error) {
    return [];
  }
}

const validateRow = async (row, rowCounter, sp) => {
  const {
    "SKU": sku,
    "CANTIDAD": cantidad,
    "PRECIO": precio,
    "CLIENTE": cliente,
    "S/C": descuento
  } = row

  let missingColumn;
  if (sku == undefined) {
    missingColumn = "SKU";
  }
  if (cantidad == undefined) {
    missingColumn = "CANTIDAD";
  }
  if (precio == undefined) {
    missingColumn = "PRECIO";
  }
  if (descuento == undefined) {
    missingColumn = "DESCUENTO";
  }

  if (
    sku == undefined ||
    cantidad == undefined ||
    precio == undefined ||
    descuento == undefined
  ) {
    throw new Error(`La columna ${missingColumn} no puede estar vacía`, { cause: rowCounter })
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

  try {
    // SP to validate SKU
    const query = `
      use factu_full_central_desa_nacho
      EXEC [dbo].[may_valida_excel]
      @cod_articulo = '${sku}',
      @num_cliente = '${cliente}'
    `
    await new sql.Request().query(query)
  } catch (error) {
    throw new Error(`Invalid sku: ${sku}`, { cause: rowCounter })
  }
  return { sku, cantidad, precio, cliente, descuento };
}

const validateWorkbook = async (file, sp) => {
  if (typeof sp != 'boolean') {
    throw new Error("Internal server error", { cause: `Invalid sp value: ${sp}` })
  }

  const { Sheets: sheets } = file;
  const sheetsNames = Object.keys(sheets);
  if (sheetsNames.length != 1) {
    throw new Error('El archivo debe tener exactamente 1 hja');
  }

  const sheet = sheetsNames[0];
  const sheetItems = xlsx.utils.sheet_to_json(sheets[sheet]);

  if (sheetItems.length == 0) {
    throw new Error('El archivo debe tener al menos una fila');
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

export const validateManualRows = async (rows, sp) => {
  try {
    const parsedItems = []
    let i = 0;
    for (const item of rows) {
      i += 1;
      const parsedItem = await validateRow(item, i + 1, sp);
      parsedItems.push(parsedItem);
    }
    return parsedItems;

  } catch (error) {
    throw new Error(`${error}`)
  }
}

export const parseWorkbook = async (fileName, sp) => {
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
      const message = error.cause ?? error.message;
      throw new Error(`ERROR: ${message}`)
    }
  }
}