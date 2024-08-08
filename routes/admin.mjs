import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { checkAuthenticated } from '../middlewares/auth.mjs';
import sql from 'mssql';

const obtenerClientesPedidoUnico = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const {NUM_CLIENTE: id, RAZON: razon, NOM_FANTASIA: nombreFantasia, LISTA_DESCRIP: lista, Vendedor: vendedor} = row
            return {id, razon, nombreFantasia, lista, vendedor}
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

router.get('/pedido-unico', (req, res) => {
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
    console.log(resultadosID)
      
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
    console.log(resultadosRazon)

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
    console.log(resultadosNombre)

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

router.post('/pedido-unico/buscar-por-nombre', async (req, res) => {
    const nombrePedidoUnico = req.body.codigoPedidoUnico;

    //! Consulta a DB
    const resultadosNombre = await obtenerClientesPedidoUnico(`EXEC may_client_busq_nomb @nom = '${codigoPedidoUnico}'`)
    console.log(resultadosNombre)

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

//! Esta ruta recibe el ID del cliente. Si viene del SP se usa ese, sino se asigna uno con UUID
router.post("/pedido-unico/datos-cliente", (req, res) => {
    console.log(req.body)
    // Recibir el ID
    // Consultar SP
    // Enviar solo datos. NO renderizar ni redirigir
})

router.get('/pedido-mayorista', (req, res) => {
    res.render('pedidoMayorista')
})

router.get('/ventas-adicionales', (req, res) => {
    res.render('ventasAdicionales')
})

export default router