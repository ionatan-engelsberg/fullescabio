import express from "express";
import sql from 'mssql';
import uploadExcel from "../middlewares/multer.mjs"
import path from 'path';

import { checkAuthenticated } from '../middlewares/auth.mjs';
import { parsedWorkbook } from "../xlsx.mjs";

const router = express.Router()
const __dirname = path.resolve();
router.use(checkAuthenticated)

const obtenerClientesPedidoUnico = async (query) => {
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

const obtenerTipoPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {COD_COMP: codigo, DESCRIP: nombre} = row
            return { codigo, nombre }
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

const obtenerListaPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {LISTA_DESCRIP: lista} = row
            return { lista }
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

const obtenerArticulosPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {COD_ARTICULO: codigo, DESCRIP_ARTI: nombre, PRECIO_VTA: precio} = row
            return {codigo, nombre, precio}
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

const obtenerPartidasPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const { NUM: numero, CANTI: cantidad, COD_DEPO: codigoDeposito, COSTO_UNI: costoUnitario, UBICACION_PARTIDA: ubicacion } = row
            return { numero, cantidad, codigoDeposito, costoUnitario, ubicacion }
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

const obtenerListaVendedoresPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {CODI_VENDE: codigo, NOMBRE: nombre} = row
            return {codigo, nombre}
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

router.get('/', (req, res) => {
    res.render('admin')
})


router.post("/ventas-adicionales/upload", uploadExcel.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { filename } = req.file
    parsedWorkbook(filename, true)
    .then(() => {
        console.log('Function executed successfully');
        res.render("ventasAdicionales")
    })
    .catch(error => {
        console.error('Error executing function:', error);
        res.render("ventasAdicionales")
    });
})

//todo: MODULARIZAR

//! Pedido Unico
router.get('/pedido-unico', async (req, res) => {
    res.render('pedidoUnico', {
        selectedOption: 1,
        showModal: false,
        resultadosNombre: false,
        resultadosID: false,
        resultadosRazon: false,
        nombrePedidoUnico: false,
        idPedidoUnico: false,
        razonPedidoUnico: false
    })
})

router.post('/pedido-unico/buscar-por-id', async (req, res) => {
    const idPedidoUnico = req.body.idPedidoUnico;

    //! Consulta a DB
    const resultadosID = await obtenerClientesPedidoUnico(`EXEC may_client_busq @num = '${idPedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        razonPedidoUnico: false
    });
});

router.post('/pedido-unico/buscar-por-razon', async (req, res) => {
    const razonPedidoUnico = req.body.razonPedidoUnico;

    //! Consulta a DB
    const resultadosRazon = await obtenerClientesPedidoUnico(`EXEC may_client_busq_razon @razon = '${razonPedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        nombrePedidoUnico: false
    });
});

router.post('/pedido-unico/buscar-por-nombre', async (req, res) => {
    const nombrePedidoUnico = req.body.nombrePedidoUnico;

    //! Consulta a DB
    const resultadosNombre = await obtenerClientesPedidoUnico(`EXEC may_client_busq_nomb @nom = '${nombrePedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        razonPedidoUnico: false
    });
});

router.post("/pedido-unico/obtener-articulos", async (req, res) => {
    const codigoPedidoUnico = req.body.codigoPedidoUnico;
    const listaCodigo = req.body.listaCodigo

    //! Consulta a DB
    const resultadosCodigo = await obtenerArticulosPedidoUnico(`EXEC may_articulos @cod_art = '${codigoPedidoUnico}', @lista_cod = '${listaCodigo}'`) 
    const resultadosPartidas = await obtenerPartidasPedidoUnico(`EXEC may_partidas @cod_art = '${codigoPedidoUnico}', @cod_depo = "DEP"`)
    
    res.json({
        resultadosCodigo,
        resultadosPartidas
    })
})

//! Pedido Mayorista
router.get('/pedido-mayorista', async (req, res) => {
    res.render('pedidoMayorista', {
        selectedOption: 1,
        showModal: false,
        resultadosNombre: false,
        resultadosID: false,
        resultadosRazon: false,
        nombrePedidoUnico: false,
        idPedidoUnico: false,
        razonPedidoUnico: false
    })
})

router.post('/pedido-mayorista/buscar-por-id', async (req, res) => {
    const idPedidoUnico = req.body.idPedidoUnico;

    //! Consulta a DB
    const resultadosID = await obtenerClientesPedidoUnico(`EXEC may_client_busq @num = '${idPedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

    res.render("pedidoMayorista", {
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
        razonPedidoUnico: false
    });
});

router.post('/pedido-mayorista/buscar-por-razon', async (req, res) => {
    const razonPedidoUnico = req.body.razonPedidoUnico;

    //! Consulta a DB
    const resultadosRazon = await obtenerClientesPedidoUnico(`EXEC may_client_busq_razon @razon = '${razonPedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

    res.render("pedidoMayorista", {
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
        nombrePedidoUnico: false
    });
});

router.post('/pedido-mayorista/buscar-por-nombre', async (req, res) => {
    const nombrePedidoUnico = req.body.nombrePedidoUnico;

    //! Consulta a DB
    const resultadosNombre = await obtenerClientesPedidoUnico(`EXEC may_client_busq_nomb @nom = '${nombrePedidoUnico}'`)
    const tiposPedidoUnico = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

    res.render("pedidoMayorista", {
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
        razonPedidoUnico: false
    });
});

router.post("/pedido-mayorista/obtener-articulos", async (req, res) => {
    const codigoPedidoUnico = req.body.codigoPedidoUnico;
    const listaCodigo = req.body.listaCodigo

    //! Consulta a DB
    const resultadosCodigo = await obtenerArticulosPedidoUnico(`EXEC may_articulos @cod_art = '${codigoPedidoUnico}', @lista_cod = '${listaCodigo}'`) 
    const resultadosPartidas = await obtenerPartidasPedidoUnico(`EXEC may_partidas @cod_art = '${codigoPedidoUnico}', @cod_depo = "DEP"`)
    
    res.json({
        resultadosCodigo,
        resultadosPartidas
    })
})

//! Ventas Adicionales
router.get('/ventas-adicionales', (req, res) => {
    res.render('ventasAdicionales')
})


export default router