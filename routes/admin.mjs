import express from "express";
import sql from "mssql";
import fs from "fs";
import uploadExcel from "../middlewares/multer.mjs";
import path from "path";

import { checkAuthenticated } from "../middlewares/auth.mjs";
import { parseWorkbook, validateManualRows } from "../xlsx.mjs";

//! !!!!
//todo: !!! MODULARIZAR !!!
//! !!!!
const router = express.Router();
const __dirname = path.resolve();
router.use(checkAuthenticated);

function convertirStringANumero(str) {
  let sanitizedStr = str.replace(/\./g, "");
  sanitizedStr = sanitizedStr.replace(",", ".");
  const numero = parseFloat(sanitizedStr);
  return numero;
}

const obtenerClientesPedidoUnico = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const {
        NUM_CLIENTE: id,
        RAZON: razon,
        NOM_FANTASIA: nombreFantasia,
        LISTA_DESCRIP: lista,
        VENDEDOR: vendedor,
        LISTA_CODI: listaCodigo,
      } = row;
      return { id, razon, nombreFantasia, lista, vendedor, listaCodigo };
    });
  } catch (error) {
    return [];
  }
};

const obtenerTipoPedidoUnico = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const { COD_COMP: codigo, DESCRIP: nombre } = row;
      return { codigo, nombre };
    });
  } catch (error) {
    return [];
  }
};

const obtenerListaPedidoUnico = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const { LISTA_DESCRIP: lista, LISTA_CODI: codigo } = row;
      return { lista, codigo };
    });
  } catch (error) {
    return [];
  }
};

const obtenerArticulosPedidoUnico = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const {
        COD_ARTICULO: codigo,
        DESCRIP_ARTI: nombre,
        PRECIO_VTA: precio,
      } = row;
      return { codigo, nombre, precio };
    });
  } catch (error) {
    return [];
  }
};

const obtenerPartidas = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const {
        COD_PARTIDA: numero,
        CANT_PEND: cantidad,
        DEPO: codigoDeposito,
        COSTO_UNI: costoUnitario,
        UBICACION_PARTIDA: ubicacion,
      } = row;
      return { numero, cantidad, codigoDeposito, costoUnitario, ubicacion };
    });
  } catch (error) {
    return [];
  }
};

const obtenerListaVendedoresPedidoUnico = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const { CODI_VENDE: codigo, NOMBRE: nombre } = row;
      return { codigo, nombre };
    });
  } catch (error) {
    return [];
  }
};

const obtenerClienteAgrupacion = async (query) => {
  try {
    const request = await new sql.Request().query(query);
    return request.recordset.map((row) => {
      const { AGRU_3: codigo, DESCRIP_AGRU: nombre } = row;
      return { codigo, nombre };
    });
  } catch (error) {
    return [];
  }
};

const obtenerNumWeb = async (tipo) => {
  try {
    const request = await new sql.Request().query(
      `EXEC may_prox_comp @comp = ${tipo}`
    );
    return request.recordset.map((row) => {
      const { PROX_NUM: num } = row;
      return { num };
    });
  } catch (error) {
    return [];
  }
};

const execQueryAlta = async (request, object, numWeb) => {
  const {
    id,
    listaCodigo,
    vendedor,
    fecha,
    tipo,
    montoPrecioTotal,
    montoItemsTotal,
  } = object;

  let parsedTotal = Number(montoPrecioTotal);
  console.log(typeof parsedTotal);

  const query = `
        EXEC pediweb_pedi_cabe_alta 
        @tipo = '${tipo}',
        @num_cliente = '${id}',
        @fecha = '${fecha}',
        @total = ${parsedTotal},
        @lista_codi = '${listaCodigo}',
        @cant_max_items_web = '${montoItemsTotal}',
        @num_web = '${numWeb}',
        @codi_vende = '${vendedor}',
        @obser = '',
        @usuario = 'c1', 
        @condi_venta = '1',
        @mone = 'PES', 
        @porcen_descuen = '0',
        @mone_coti = null,
        @num_factu = null,
        @codi_lugar = null
    `;

  console.log("query ", query);
  await request.query(query);
};

const execUpdate = async (request, object, depo, numWeb) => {
  const { tipo, partidas: filas } = object;
  let renglon = 1;

  for (const fila of filas) {
    const {
      articulos: { codigo: codigoArticulo, cantidad, precioTotal },
    } = fila;
    const query = `
            EXEC pediweb_pedi_items_alta
            @tipo = '${tipo}',
            @articulo = '${codigoArticulo}',
            @precio = '${convertirStringANumero(precioTotal)}',
            @cant = '${cantidad}',
            @num_web = '${numWeb}',
            @renglon = '${renglon}',
            @porcen_descuen_item = 0,
            @depo_reser = '${depo}'
        `;
    console.log("update ", query);
    await request.query(query);
    renglon++;
  }
};

const execTransferencia = async (object, numWeb) => {
  const { fecha, tipo, partidas } = object;

  function cleanString(str) {
    return str.trim().replace(/\s+/g, " ");
  }

  try {
    for (const partida of partidas) {
      const {
        data,
        articulos: { codigo: codArt, cantidad },
      } = partida;
      for (const p of data) {
        const { numero: codPartida } = p;

        const cleanCodArt = cleanString(codArt);
        const cleanCodPartida = cleanString(codPartida);
        const cleanFecha = fecha.trim();
        const cleanPediTipo = cleanString(tipo);

        console.log(
          "Executing stored procedure with the following parameters:"
        );
        console.log(
          `cleanCodArt: ${cleanCodArt} (length: ${cleanCodArt.length})`
        );
        console.log(
          `cleanCodPartida: ${cleanCodPartida} (length: ${cleanCodPartida.length})`
        );
        console.log(`cleanFecha: ${cleanFecha} (length: ${cleanFecha.length})`);
        console.log(
          `cleanPediTipo: ${cleanPediTipo} (length: ${cleanPediTipo.length})`
        );
        console.log(`Numweb: ${numWeb} (length: ${numWeb.length})`);

        const request = new sql.Request();

        await request.query("SET ANSI_WARNINGS OFF");

        request.queryTimeout = 30000;
        request.connectionTimeout = 30000;

        request.input("tipo", sql.VarChar, "STR");
        request.input("cod_articulo", sql.VarChar, cleanCodArt);
        request.input("cod_partida", sql.VarChar, cleanCodPartida);
        request.input("depo_ori", sql.VarChar, "DEP");
        request.input("depo_desti", sql.VarChar, "MAY");
        request.input("cantidad", sql.Int, cantidad);
        request.input("fecha", sql.Date, cleanFecha);
        request.input("pedi_tipo", sql.VarChar, cleanPediTipo);
        request.input("pedi_num", sql.Int, numWeb);

        // request.input('tipo', sql.VarChar, 'STR');
        // request.input('cod_articulo', sql.VarChar, "c1");
        // request.input('cod_partida', sql.VarChar, "1");
        // request.input('depo_ori', sql.VarChar, 'DEP');
        // request.input('depo_desti', sql.VarChar, 'MAY');
        // request.input('cantidad', sql.Int, cantidad);
        // request.input('fecha', sql.Date, '2024-11-07');
        // request.input('pedi_tipo', sql.VarChar, 'DDW');
        // request.input('pedi_num', sql.Int, numWeb);

        const response = await request.execute("full_transferencia_mayo");
        console.log(response);

        await request.query("SET ANSI_WARNINGS ON");
      }
    }
  } catch (error) {
    console.log("Error en execTransferencia:", error);
    throw error;
  }
};

const finalizarPedidoMayorista = async (objeto) => {
  try {
    const transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction);

    try {
      const numWeb = await obtenerNumWeb(objeto.tipo);
      await execQueryAlta(request, objeto, numWeb[0].num);
      await execUpdate(request, objeto, "MAY", numWeb[0].num);

      await transaction.commit();
      return { msg: "OK", numWeb };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

const finalizarPedidoUnico = async (objeto) => {
  try {
    const numWeb = await obtenerNumWeb(objeto.tipo);
    await execTransferencia(objeto, numWeb[0].num);

    const transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction);

    try {
      await execQueryAlta(request, objeto, numWeb[0].num);
      await execUpdate(request, objeto, "DEP", numWeb[0].num);

      await transaction.commit();
      return { msg: "OK", numWeb };
    } catch (error) {
      console.log("Rollback: ", error);
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
};

const execVentasAdicionalesSp = async (
  request,
  fila,
  fechaActual,
  fechaDesde,
  fechaHasta
) => {
  const { sku, cantidad } = fila;
  const queryUpdate = `
    EXEC [may_proveedores_articulos_incidencia_2]
    @Cod_articulo = ${sku},
    @cantidad = ${cantidad},
    @comprobante = ${parseInt(fechaActual.replace(/-/g, ""), 10)},
    @fecha_desde = '${fechaDesde}',
    @fecha_hasta = '${fechaHasta}' 
    `;

  console.log(queryUpdate);

  const resultUpdate = await request.query(queryUpdate);

  return resultUpdate;
};

const execVentasAdicionalesDirect = async (request, fila, fechaActual) => {
  const { sku, cantidad, cliente, precio } = fila;
  const queryInsert = `
    EXEC may_proveedores_articulos_directo
    @cod_articulo='${sku}',
    @cod_cliente = '${cliente}',
    @comprobante = ${parseInt(fechaActual.replace(/-/g, ""), 10)},
    @cantidad = ${cantidad},
    @precio = '${precio}',
    @validar = 'N'
    `;

  await request.query(queryInsert);
};

const finalizarVentasAdicionalesDirect = async (filas, fechaActual) => {
  try {
    const transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction);

    try {
      for (const fila of filas) {
        await execVentasAdicionalesDirect(request, fila, fechaActual);
      }

      await transaction.commit();
      return { msg: "OK" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

const finalizarVentasAdicionalesSp = async (
  filas,
  fechaActual,
  fechaDesde,
  fechaHasta
) => {
  try {
    const transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction);

    try {
      for (const fila of filas) {
        await execVentasAdicionalesSp(
          request,
          fila,
          fechaActual,
          fechaDesde,
          fechaHasta
        );
      }

      await transaction.commit();
      return { msg: "OK" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

router.post("/pedido-unico/update", async (req, res) => {
  try {
    const { body } = req;
    const result = await finalizarPedidoUnico(body);
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

router.post("/pedido-mayorista/update", async (req, res) => {
  try {
    const { body } = req;
    const result = await finalizarPedidoMayorista(body);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.get("/", async (req, res) => {
  const { username, password, database, ip, port, instanceName } = req.user;

  let unhashedPass;
  const FACTU_DBA_PASS = process.env.FACTU_DBA_PASS;
  const FACTU_DBA_NORTE_DESA_PASS = process.env.FACTU_DB_NORTE_DESA_PASS;
  const FACTU_DBA_NORTE_PASS = process.env.FACTU_DBA_NORTE_PASS;

  switch (database) {
    case "factu_dba":
      unhashedPass = FACTU_DBA_PASS;
    case "factu_dba_norte_desa":
      unhashedPass = FACTU_DBA_NORTE_DESA_PASS;
    case "factu_dba_norte":
      unhashedPass = FACTU_DBA_NORTE_PASS;
  }

  const config = {
    user: "dba_lautaro",
    password: process.env.PASSWORD,
    server: ip,
    database: database,
    port: Number(port),
    options: {
      encrypt: false,
      trustServerCertificate: false,
      instancename: instanceName,
    },
  };

  try {
    await sql.connect(config);

    sql.on("error", (err) => {
      console.error("SQL Global Error:", err);
    });

    const pool = new sql.ConnectionPool(config);
    pool.on("error", (err) => {
      console.error("SQL Pool Error:", err);
    });

    console.log("Conection OK");
  } catch (error) {
    console.log("ERROR while connecting to DB: ", error);
  }

  res.render("admin");
});

//! Ventas Adicionales
router.post("/ventas-adicionales/update-sp", async (req, res) => {
  try {
    const { data, fechaActual, fechaDesde, fechaHasta } = req.body;
    console.log("cucatrap ", req.body);
    const result = await finalizarVentasAdicionalesSp(
      data,
      fechaActual,
      fechaDesde,
      fechaHasta
    );
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.post("/ventas-adicionales/update-direct", async (req, res) => {
  try {
    const { data, fechaActual } = req.body;
    const result = await finalizarVentasAdicionalesDirect(data, fechaActual);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.get("/ventas-adicionales", async (req, res) => {
  const agrupacion = await obtenerClienteAgrupacion(`EXEC may_client_agru`);
  res.render("ventasAdicionales", {
    agrupacionSeleccionada: "",
    agrupacion,
    data: [],
    dinamicoBTN: false,
    importadorBTN: false,
    verPedidoButton: false,
    chooseImportMethod: false,
    chooseSPMethod: false,
    fechas: false,
    selectAgrupacion: false,
    SPUpload: true,
    directUpload: false,
    error: "",
    existsError: false,
  });
});

router.post("/ventas-adicionales/validate-rows", async (req, res) => {
  const { agrupacionSeleccionada, data } = req.body;
  const agrupacion = await obtenerClienteAgrupacion(`EXEC may_client_agru`);

  await validateManualRows(data, false)
    .then((data) => {
      res.json({
        agrupacionSeleccionada,
        agrupacion,
        data,
        verPedidoButton: true,
        chooseImportMethod: true,
        chooseSPMethod: true,
        fechas: true,
        selectAgrupacion: true,
        SPUpload: false,
        directUpload: true,
        existsError: false,
        error: "",
      });
      return data;
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

router.post(
  "/ventas-adicionales/upload",
  uploadExcel.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const { agrupacionSeleccionada } = req.body;
    const { filename } = req.file;
    const agrupacion = await obtenerClienteAgrupacion(`EXEC may_client_agru`);

    await parseWorkbook(filename, false)
      .then((data) => {
        res.render("ventasAdicionales", {
          agrupacionSeleccionada,
          agrupacion,
          data,
          verPedidoButton: true,
          chooseImportMethod: true,
          chooseSPMethod: true,
          fechas: true,
          selectAgrupacion: true,
          SPUpload: true,
          directUpload: false,
          error: "",
          existsError: false,
        });
      })
      .catch((error) => {
        res.render("ventasAdicionales", {
          agrupacionSeleccionada,
          agrupacion,
          error,
          data: "",
          verPedidoButton: false,
          chooseImportMethod: true,
          chooseSPMethod: true,
          fechas: true,
          selectAgrupacion: true,
          SPUpload: true,
          directUpload: false,
          existsError: true,
        });
      });
  }
);

router.post(
  "/ventas-adicionales/direct-upload",
  uploadExcel.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const { filename } = req.file;

    await parseWorkbook(filename, false)
      .then((data) => {
        res.render("ventasAdicionales", {
          agrupacion: [],
          data,
          verPedidoButton: true,
          chooseImportMethod: true,
          chooseSPMethod: true,
          fechas: true,
          selectAgrupacion: true,
          SPUpload: false,
          directUpload: true,
          existsError: false,
          error: "",
        });
      })
      .catch((error) => {
        res.render("ventasAdicionales", {
          data: [],
          agrupacion: [],
          error,
          verPedidoButton: false,
          chooseImportMethod: true,
          chooseSPMethod: true,
          fechas: true,
          selectAgrupacion: true,
          SPUpload: false,
          directUpload: true,
          existsError: true,
        });
      });
  }
);

//! Pedido Unico
router.get("/pedido-unico", async (req, res) => {
  res.render("pedidoUnico", {
    selectedOption: 1,
    showModal: false,
    resultadosNombre: false,
    resultadosID: false,
    resultadosRazon: false,
    nombrePedidoUnico: false,
    idPedidoUnico: false,
    razonPedidoUnico: false,
  });
});

router.post("/pedido-unico/buscar-por-id", async (req, res) => {
  const idPedidoUnico = req.body.idPedidoUnico;

  //! Consulta a DB
  const resultadosID = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq @num = '${idPedidoUnico}'`
  );
  const tiposPedidoUnico = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoUnico", {
    lista,
    listaVendedor,
    tiposPedidoUnico,
    idPedidoUnico,
    resultadosID,
    selectedOption: 1,
    showModal: true,
    resultadosRazon: false,
    resultadosNombre: false,
    nombrePedidoUnico: false,
    razonPedidoUnico: false,
  });
});

router.post("/pedido-unico/buscar-por-razon", async (req, res) => {
  const razonPedidoUnico = req.body.razonPedidoUnico;

  //! Consulta a DB
  const resultadosRazon = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq_razon @razon = '${razonPedidoUnico}'`
  );
  const tiposPedidoUnico = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoUnico", {
    lista,
    listaVendedor,
    tiposPedidoUnico,
    razonPedidoUnico,
    resultadosRazon,
    selectedOption: 2,
    showModal: true,
    resultadosID: false,
    resultadosNombre: false,
    idPedidoUnico: false,
    nombrePedidoUnico: false,
  });
});

router.post("/pedido-unico/buscar-por-nombre", async (req, res) => {
  const nombrePedidoUnico = req.body.nombrePedidoUnico;

  //! Consulta a DB
  const resultadosNombre = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq_nomb @nom = '${nombrePedidoUnico}'`
  );
  const tiposPedidoUnico = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoUnico", {
    lista,
    listaVendedor,
    tiposPedidoUnico,
    nombrePedidoUnico,
    resultadosNombre,
    selectedOption: 3,
    showModal: true,
    resultadosID: false,
    resultadosRazon: false,
    idPedidoUnico: false,
    razonPedidoUnico: false,
  });
});

router.post("/pedido-unico/obtener-articulos", async (req, res) => {
  const codigoPedidoUnico = req.body.codigoPedidoUnico;
  const listaCodigo = req.body.listaCodigo;

  //! Consulta a DB
  const resultadosCodigo = await obtenerArticulosPedidoUnico(
    `EXEC may_articulos @cod_art = '${codigoPedidoUnico}', @lista_cod = '${listaCodigo}'`
  );
  const resultadosPartidas = await obtenerPartidas(
    `EXEC may_arti_partidas @cod_art = '${codigoPedidoUnico}', @cod_depo = "DEP"`
  );

  res.json({
    resultadosCodigo,
    resultadosPartidas,
  });
});

router.post("/pedido-unico/buscar-codigo-articulo", async (req, res) => {
  const { descripcion, listaCodigo } = req.body;

  //! Consulta a DB
  const resultadosDescripcion = await obtenerArticulosPedidoUnico(
    `EXEC may_articulos @descrip = '${descripcion}', @lista_cod = '${listaCodigo}'`
  );
  for (let i = 0; i < resultadosDescripcion.length; i++) {
    const resultadosPartidas = await obtenerPartidas(
      `EXEC may_arti_partidas @cod_art = '${resultadosDescripcion[i].codigo}', @cod_depo = "DEP"`
    );
    resultadosDescripcion[i].poseePartidas = resultadosPartidas.length != 0;
  }

  res.json({
    resultadosDescripcion,
  });
});

//! Pedido Mayorista
router.post("/pedido-mayorista/buscar-codigo-articulo", async (req, res) => {
  const { descripcion, listaCodigo } = req.body;

  //! Consulta a DB
  const resultadosDescripcion = await obtenerArticulosPedidoUnico(
    `EXEC may_articulos @descrip = '${descripcion}', @lista_cod = '${listaCodigo}'`
  );
  for (let i = 0; i < resultadosDescripcion.length; i++) {
    const resultadosPartidas = await obtenerPartidas(
      `EXEC may_arti_partidas @cod_art = '${resultadosDescripcion[i].codigo}', @cod_depo = "MAY"`
    );
    resultadosDescripcion[i].poseePartidas = resultadosPartidas.length != 0;
  }

  res.json({
    resultadosDescripcion,
  });
});

router.get("/pedido-mayorista", async (req, res) => {
  res.render("pedidoMayorista", {
    selectedOption: 1,
    showModal: false,
    resultadosNombre: false,
    resultadosID: false,
    resultadosRazon: false,
    nombrePedidoMayorista: false,
    idPedidoMayorista: false,
    razonPedidoMayorista: false,
  });
});

router.post("/pedido-mayorista/obtener-articulos", async (req, res) => {
  const codigoPedidoMayorista = req.body.codigoPedidoMayorista;
  const listaCodigo = req.body.listaCodigo;

  //! Consulta a DB
  const resultadosCodigo = await obtenerArticulosPedidoUnico(
    `EXEC may_articulos @cod_art = '${codigoPedidoMayorista}', @lista_cod = '${listaCodigo}'`
  );
  const resultadosPartidas = await obtenerPartidas(
    `EXEC may_arti_partidas @cod_art = '${codigoPedidoMayorista}', @cod_depo = "MAY"`
  );
  res.json({
    resultadosCodigo,
    resultadosPartidas,
  });
});

router.post("/pedido-mayorista/buscar-por-id", async (req, res) => {
  const idPedidoMayorista = req.body.idPedidoMayorista;

  //! Consulta a DB
  const resultadosID = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq @num = '${idPedidoMayorista}'`
  );
  const tiposPedidoMayorista = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoMayorista", {
    lista,
    listaVendedor,
    tiposPedidoMayorista,
    idPedidoMayorista,
    resultadosID,
    selectedOption: 1,
    showModal: true,
    resultadosRazon: false,
    resultadosNombre: false,
    nombrePedidoMayorista: false,
    razonPedidoMayorista: false,
  });
});

router.post("/pedido-mayorista/buscar-por-razon", async (req, res) => {
  const razonPedidoMayorista = req.body.razonPedidoMayorista;

  //! Consulta a DB
  const resultadosRazon = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq_razon @razon = '${razonPedidoMayorista}'`
  );
  const tiposPedidoMayorista = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoMayorista", {
    lista,
    listaVendedor,
    tiposPedidoMayorista,
    razonPedidoMayorista,
    resultadosRazon,
    selectedOption: 2,
    showModal: true,
    resultadosID: false,
    resultadosNombre: false,
    idPedidoMayorista: false,
    nombrePedidoMayorista: false,
  });
});

router.post("/pedido-mayorista/buscar-por-nombre", async (req, res) => {
  const nombrePedidoMayorista = req.body.nombrePedidoMayorista;

  //! Consulta a DB
  const resultadosNombre = await obtenerClientesPedidoUnico(
    `EXEC may_client_busq_nomb @nom = '${nombrePedidoMayorista}'`
  );
  const tiposPedidoMayorista = await obtenerTipoPedidoUnico(
    `EXEC may_comp_pedidos`
  );
  const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`);
  const listaVendedor = await obtenerListaVendedoresPedidoUnico(
    `EXEC may_lista_vendedores`
  );

  res.render("pedidoMayorista", {
    lista,
    listaVendedor,
    tiposPedidoMayorista,
    nombrePedidoMayorista,
    resultadosNombre,
    selectedOption: 3,
    showModal: true,
    resultadosID: false,
    resultadosRazon: false,
    idPedidoMayorista: false,
    razonPedidoMayorista: false,
  });
});

export default router;
