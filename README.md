-- SP Clientes agrupaciones
exec may_client_agru @agrup = 'MELI' 

-- SP Clientes busqueda
exec may_client_busq @num = '7035'


 -- SP Articulos
exec may_articulos @cod_art = 'c9323'


-- SP Partidas
exec may_partidas @cod_art = 'c9'

-- SP Tipo
exec may_pedidos

Todo: 
Mostrar conjunto de listas x cliente. No es obligatorio que el cliente elija lista, hacer la llamada a lista una vez que el usuario confirmo cliente --> done
Implementar select de Tipo. Viene x sp --> done
No puede exceder el la cantidad TOTAL de partidas. Implementar saldo pendiente de cantidad


SP Clientes Agrupaciones --> Falta lista codi
SP Lista Por Cliente --> EXEC MAY_LISTA_PRECIOS. Recibe codigo y valor
SP Partidas --> Listo
SP Tipo --> Listo. Ya implementado
SP Articulos --> Falta pasarle lista codi

UNICO = DEP

Boton partidas --> Elije cantidad de cada partida
Campo costo viene por sp de partidas y siempre se debe cargar el menor costo


Precio total -- ok
Cambiar de lugar precio x costo -- ok
Costo cambia de valor, ver por cual -- ok

Cantidad a favor tiene que ser igual a cantidad seleccionada si o si

Agregar total venta -- ok
Quitar costo unitario -- ok
Agregar columna "margen" -- ok

ALTER procedure [dbo].[pediweb_pedi_cabe_alta]
@tipo varchar(3)=null,
@num_web varchar(20)=null,
@num_cliente varchar(20)=null,
@usuario varchar(30)=null,
@num_factu varchar(20)=null,
@fecha varchar(20)=null,
@total varchar(20)=null,
@codi_vende varchar(5)=null,
@mone varchar(3)=null,
@mone_coti varchar(20)=null,
@lista_codi varchar(5)=null,
@condi_venta varchar(5)=null,
@obser varchar(255)=null,
@porcen_descuen varchar(20)=null,
@cant_max_items_web varchar(20)=null,
@codi_lugar varchar(20)=null
ALTER procedure [dbo].[pediweb_pedi_items_alta]
@tipo varchar(3)=null,
@num_web varchar(20)=null,
@renglon varchar(20)=null,
@articulo varchar(30)=null,
@cant varchar(20)=null,
@precio varchar(20)=null,
@porcen_descuen_item varchar(20)=null

NO se puede 2 filas con mismo articulo -- ok
Pedido mayorista no usa transferencia -- revisar

Ventas Adicionales
Uno incluye SP, el otro no. 
No incluye: Desde Front valido que cada uno de los clientes recibidos x backend existan. 

clientes,sku,des,cantidad,precio. (sp dinamico)
Si cliente esta vacio => se autocompleta con agrupacion clientes seleccionada (sp dinamico). Este no puede ser null. Esto aplica a manual y a excel.
pasar form manual a sp dinamico
NO pueden mandar formulario y excel a la vez. Es uno o el otro

--- --- ---- 
vtas ad, camviar var compr