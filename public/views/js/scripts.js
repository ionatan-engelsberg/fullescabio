document.addEventListener('DOMContentLoaded', () => {
    // Mostrar modal
    let showModal = document.getElementById('showModal').value;
    let modal = new bootstrap.Modal(document.getElementById('seleccionarClienteModalPedidoUnico'));
    if (showModal === 'true') {
        modal.show();
    }

    // Logica de seleccionado de item
    const resultItems = document.querySelectorAll('.result-item');
    const confirmButton = document.getElementById('confirmarSeleccion');
    let selectedItemId = null;
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            resultItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedItemId = item.getAttribute('data-id');
            confirmButton.disabled = false;
        });
    });

    // Post a backend. De momento no es necesario
    confirmButton.addEventListener('click', () => {
        if (selectedItemId) {
            confirmButton.disabled = true;
            const data = { id: selectedItemId };
            fetch('/admin/pedido-unico/datos-cliente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
               
            })

            // Una vez finalizado el flujo se oculta el modal
            modal.hide()                        
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Freeze inputs 
    const confirmarClienteButton = document.getElementById('confirmarCliente');
    const inputListaPedidoUnico = document.querySelector('input[name="listaPedidoUnico"]');
    // ...

    confirmarClienteButton.addEventListener('click', () => {
        inputListaPedidoUnico.disabled = true;
        inputListaPedidoUnico.classList.add('input-disabled'); 
        // ... 
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const resultItems = document.querySelectorAll('.result-item');
    let selectedResult = null;

    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            resultItems.forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            document.getElementById('confirmarSeleccion').disabled = false;
            selectedResult = {
                id: item.getAttribute('data-id'),
                nombre: item.getAttribute('data-nombre')
            };
        });
    });

    document.getElementById('confirmarSeleccion').addEventListener('click', () => {
        if (selectedResult) {
            console.log('Resultado seleccionado:', selectedResult);
        //todo: Cargar los datos en los inputs
        }
    });
});

// Select de tipo de busqueda
document.getElementById('optionSelect').addEventListener('change', function() {
    document.getElementById('idContainer').style.display = 'none';
    document.getElementById('razonContainer').style.display = 'none';
    document.getElementById('nombreFantasiaContainer').style.display = 'none';

    const selectedValue = this.value;
    if (selectedValue === '1') {
        document.getElementById('idContainer').style.display = 'block';
    } else if (selectedValue === '2') {
        document.getElementById('razonContainer').style.display = 'block';
    } else if (selectedValue === '3') {
        document.getElementById('nombreFantasiaContainer').style.display = 'block';
    }
});

document.getElementById('optionSelect').dispatchEvent(new Event('change'));
