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