import express from "express";
import sql from 'mssql';
import uploadExcel from "../middlewares/multer.mjs"
import path from 'path';

import { checkAuthenticated } from '../middlewares/auth.mjs';
import { parsedWorkbook } from "../xlsx.mjs";

//! !!!!
//todo: !!! MODULARIZAR !!!
//! !!!!
const router = express.Router()
const __dirname = path.resolve();
router.use(checkAuthenticated)

function convertirStringANumero(str) {
    let sanitizedStr = str.replace(/\./g, '');
    sanitizedStr = sanitizedStr.replace(',', '.');
    const numero = parseFloat(sanitizedStr);
    return numero;
}

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
            const { COD_COMP: codigo, DESCRIP: nombre } = row
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
            const { LISTA_DESCRIP: lista } = row
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
            const { COD_ARTICULO: codigo, DESCRIP_ARTI: nombre, PRECIO_VTA: precio } = row
            return { codigo, nombre, precio }
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
            const { COD_PARTIDA: numero, CANT_PEND: cantidad, COD_DEPO: codigoDeposito, COSTO_UNI: costoUnitario, UBICACION_PARTIDA: ubicacion } = row
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
            const { CODI_VENDE: codigo, NOMBRE: nombre } = row
            return { codigo, nombre }
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
}

const obtenerClienteAgrupacion = async (query) => {
    try {
        const request = await new sql.Request().query(query)
        return request.recordset.map((row) => {
            const { AGRU_3: codigo, DESCRIP_AGRU: nombre } = row
            return { codigo, nombre }
        })
    } catch (error) {
        console.log('ERROR: ', error);
        return [];
    }
}

const numWeb = 10337

const execQueryAlta = async (request, object) => {
    const { id, lista, listaCodigo, vendedor, fecha, tipo, montoPrecioTotal , montoItemsTotal ,partidas: filas } = object;

    filas.forEach((fila) => {
        console.log("DATA: ", fila.data)
        console.log("ARTICULOS: ", fila.articulos)
    })

    const QUERY_ALTA = `
        EXEC pediweb_pedi_cabe_alta 
        @tipo = '${tipo}',
        @num_cliente = '${id}',
        @fecha = '${fecha}',
        @total = '${montoPrecioTotal}',
        @lista_codi = '${listaCodigo}',
        @cant_max_items_web = '${montoItemsTotal}',
        @num_web = '${numWeb}',
        @codi_vende = '${vendedor}',
        @obser = 'LAUTI ESTAS LEYENDO ESTO?',
        @usuario = 'c1', 
        @condi_venta = '1',
        @mone = 'PES', 
        @mone_coti = null,
        @num_factu = null,
        @porcen_descuen = null,
        @codi_lugar = null
    `
    console.log(QUERY_ALTA)

    const requestQueryAlta = await request.query(QUERY_ALTA);
    console.log('RESPONSE QUERY ALTA: ', requestQueryAlta);
}

const execUpdate = async (request, object, depo) => {
    //! @renglon y @num_web se asignan automaticamente en la db
    const { id, lista, listaCodigo, vendedor, fecha, tipo, partidas: filas } = object;

    try {
        for (const fila of filas) {
            const { data, articulos: { codigo: codigoArticulo, cantidad, precioTotal } } = fila
            const queryFila = `
            EXEC pediweb_pedi_items_alta
            @tipo = '${tipo}',
            @articulo = '${codigoArticulo}',
            @precio = '${convertirStringANumero(precioTotal)}',
            @cant = '${cantidad}',
            @num_web = '${numWeb}',
            @renglon = '1',
            @porcen_descuen_item = null,
            @depo_reser = '${depo}'
        `
            console.log(queryFila)
            const requestFila = await request.query(queryFila)
            console.log('RESPONSE REQUEST FILA: ', requestFila);
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

// TODO
const execTransferencia = async (request, object) => {}

const finalizarPedidoUnico = async (objeto) => {
    try {
        const transaction = new sql.Transaction()
        await transaction.begin()
        const request = new sql.Request(transaction)
        
        try {
            await execQueryAlta(request, objeto);
            await execTransferencia(request, objeto);
            await execUpdate(request, objeto, 'DEP')
    
            await transaction.commit();
            return { msg: 'OK' }
        } catch (error) {
            await transaction.rollback();            
            throw error;
        }
    } catch (error) {
        console.log('ERROR: ', error);      
        throw error;  
    }
}

const finalizarPedidoMayorista = async (objeto) => {
    try {
        const transaction = new sql.Transaction()
        await transaction.begin()
        const request = new sql.Request(transaction)

        try {
            await execQueryAlta(request, objeto);
            await execUpdate(request, objeto, 'MAY')
    
            await transaction.commit();
            return { msg: 'OK' }
        } catch (error) {
            await transaction.rollback();            
            throw error;
        }
    } catch (error) {
        console.log('ERROR: ', error);      
        throw error;  
    }
}

const execVentasAdicionales = async (request, fila) => {
    const {sku, cantidad} = fila
    const comprobante = 20240829;
    // const comprobante = 1;

    const query = `
    exec [may_Proveedores_articulos_incidencia]
    @Cod_articulo = ${sku},
    @cantidad = ${cantidad},
    @comprobante = ${comprobante},
    @fecha_desde = null,
    @fecha_hasta = null
    `
    const result = await request.query(query)
    return result
};

const finalizarVentasAdicionales = async (filas) => {
    try {
        const transaction = new sql.Transaction()
        await transaction.begin()
        const request = new sql.Request(transaction)

        try {
            for (const fila of filas) {
                await execVentasAdicionales(request, fila);
            }
    
            await transaction.commit();
            return { msg: 'OK' }
        } catch (error) {
            console.log(error)  
            await transaction.rollback();          
            throw error;
        }
    } catch (error) {
        console.log('ERROR: ', error);      
        throw error;  
    }
}

router.post("/pedido-unico/update", async (req, res) => {
    try {
        const { body } = req;
        const result = await finalizarPedidoUnico(body);
        return res.status(200).send(result);
    } catch (error) {
        console.error("Error al actualizar el pedido:", error);
        return res.status(500).send(error);
    }
});

router.post("/pedido-mayorista/update", async (req, res) => {
    try {
        const { body } = req;
        const result = await finalizarPedidoMayorista(body);
        return res.status(200).send(result);
    } catch (error) {
        console.error("Error al actualizar el pedido:", error);
        return res.status(500).send(error);
    }
});

router.get('/', (req, res) => {
    res.render('admin')
})

//! Ventas Adicionales
router.post("/ventas-adicionales/update", async (req, res) => {
    try {
        const { body } = req;
        const result = await finalizarVentasAdicionales(body.data);
        return res.status(200).send(result);
    } catch (error) {
        console.error("Error al actualizar el pedido:", error);
        return res.status(500).send(error);
    }
})

router.get('/ventas-adicionales', async (req, res) => {
    const agrupacion = await obtenerClienteAgrupacion(`EXEC may_client_agru`)
    res.render('ventasAdicionales', {
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
        error: ""
    })
})

router.post("/ventas-adicionales/upload", uploadExcel.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { agrupacionSeleccionada } = req.body
    const { filename } = req.file
    const agrupacion = await obtenerClienteAgrupacion(`EXEC may_client_agru`)

    await parsedWorkbook(filename, true)
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
                error: ""
            })
        })
        .catch(error => {
            console.error('Error executing function:', error);
            res.render("ventasAdicionales", {
                agrupacionSeleccionada,
                agrupacion,
                error
            })
        });
})

router.post("/ventas-adicionales/direct-upload", uploadExcel.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { filename } = req.file

    await parsedWorkbook(filename, false)
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
                error: ""
            })
        })
        .catch(error => {
            console.log(error)
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
            })
        });
})

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
        nombrePedidoMayorista: false,
        idPedidoMayorista: false,
        razonPedidoMayorista: false
    })
})

router.post("/pedido-mayorista/obtener-articulos", async (req, res) => {
    const codigoPedidoMayorista = req.body.codigoPedidoMayorista;
    const listaCodigo = req.body.listaCodigo

    //! Consulta a DB
    const resultadosCodigo = await obtenerArticulosPedidoUnico(`EXEC may_articulos @cod_art = '${codigoPedidoMayorista}', @lista_cod = '${listaCodigo}'`)
    const resultadosPartidas = await obtenerPartidasPedidoUnico(`EXEC may_partidas @cod_art = '${codigoPedidoMayorista}', @cod_depo = "MAY"`)

    res.json({
        resultadosCodigo,
        resultadosPartidas
    })
})

router.post('/pedido-mayorista/buscar-por-id', async (req, res) => {
    const idPedidoMayorista = req.body.idPedidoMayorista;

    //! Consulta a DB
    const resultadosID = await obtenerClientesPedidoUnico(`EXEC may_client_busq @num = '${idPedidoMayorista}'`)
    const tiposPedidoMayorista = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        razonPedidoMayorista: false
    });
});

router.post('/pedido-mayorista/buscar-por-razon', async (req, res) => {
    const razonPedidoMayorista = req.body.razonPedidoMayorista;

    //! Consulta a DB
    const resultadosRazon = await obtenerClientesPedidoUnico(`EXEC may_client_busq_razon @razon = '${razonPedidoMayorista}'`)
    const tiposPedidoMayorista = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        nombrePedidoMayorista: false
    });
});

router.post('/pedido-mayorista/buscar-por-nombre', async (req, res) => {
    const nombrePedidoMayorista = req.body.nombrePedidoMayorista;

    //! Consulta a DB
    const resultadosNombre = await obtenerClientesPedidoUnico(`EXEC may_client_busq_nomb @nom = '${nombrePedidoMayorista}'`)
    const tiposPedidoMayorista = await obtenerTipoPedidoUnico(`EXEC may_comp_pedidos`)
    const lista = await obtenerListaPedidoUnico(`EXEC may_lista_precios`)
    const listaVendedor = await obtenerListaVendedoresPedidoUnico(`EXEC may_lista_vendedores`)

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
        razonPedidoMayorista: false
    });
});

export default router