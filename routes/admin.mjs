import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { checkAuthenticated } from '../middlewares/auth.mjs';
import sql from 'mssql';

const obtenerClientesPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {NUM_CLIENTE: id, RAZON: razon, NOM_FANTASIA: nombreFantasia, LISTA_DESCRIP: lista, Vendedor: vendedor, LISTA_COD: listaCodigo} = row
            return {id, razon, nombreFantasia, lista, vendedor}
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
            const {COD_ARTICULO: codigo, DESCRIP_ARTI: nombre} = row
            return {codigo, nombre}
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

//! Devuelve de todo. Ver que sirve
const obtenerPartidasPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const { NUM } = row
            return NUM
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
} 

const router = express.Router()
router.use(checkAuthenticated)

router.get('/', (req, res) => {
    res.render('admin')
})

//todo: MODULARIZAR

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
      
    res.render("pedidoUnico", {
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

    res.render("pedidoUnico", {
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

    res.render("pedidoUnico", {
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

    //! Consulta a DB
    const resultadosCodigo = await obtenerArticulosPedidoUnico(`EXEC may_articulos @cod_art = '${codigoPedidoUnico}'`) //! Sumar lista codigo a la llamada
    const resultadosPartidas = await obtenerPartidasPedidoUnico(`EXEC may_partidas @cod_art = '${codigoPedidoUnico}'`) //! Pedido unico DEP
    
    res.json({
        resultadosCodigo,
        resultadosPartidas
    })
})

router.get('/pedido-mayorista', (req, res) => {
    res.render('pedidoMayorista')
})

router.get('/ventas-adicionales', (req, res) => {
    res.render('ventasAdicionales')
})

export default router