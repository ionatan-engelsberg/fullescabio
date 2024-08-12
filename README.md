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
Mostrar conjunto de listas x cliente. No es obligatorio que el cliente elija lista, hacer la llamada a lista una vez que el usuario confirmo cliente
Implementar select de Tipo. Viene x sp
No puede exceder el la cantidad TOTAL de partidas. Implementar saldo pendiente de cantidad