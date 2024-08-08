emailjs.init("");

const contactForm = document.getElementById("contact-form")
const nameForm = document.getElementById("name-form")
const email = document.getElementById("email-form")
const phone = document.getElementById("phone-form")
const subject = document.getElementById("subject-form")
const message = document.getElementById("text-form")
const submitBTN = document.getElementById("submit-form");

const serviceID = ""
const templateID = ""

document.addEventListener("DOMContentLoaded", () => {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault()

        var response = grecaptcha.getResponse();
        if (response.length === 0) {
            let timerInterval;
                Swal.fire({
                    title: "Por favor, completa el reCAPTCHA antes de enviar el formulario.",
                    html: "Me cerrare en <b></b> milisegundos",
                    timer: 2000,
                    imerProgressBar: true,
                    didOpen: () => {
                        Swal.showLoading();
                        const timer = Swal.getPopup().querySelector("b");
                        timerInterval = setInterval(() => {
                        timer.textContent = `${Swal.getTimerLeft()}`;
                    }, 100);
                },
                willClose: () => {
                    clearInterval(timerInterval);
                    },
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.timer) {
                        console.log("I was closed by the timer");
                    }
                })} else {
                        submitBTN.innerText = "Enviando...";
                        submitBTN.setAttribute("data-text", "Enviando...");
            
                        const templateParams = {
                            nameForm: nameForm.value,
                            email: email.value,
                            phone: business.phone,
                            subject: subject.value,
                            message: message.value,
                        };

                        emailjs.send(serviceID, templateID, templateParams).then(function (res) {
                            Swal.fire({
                                title: "¡El correo electrónico se ha enviado con éxito!",
                                text: "En breve nos comunicaremos con usted",
                                icon: "success",
                                confirmButtonColor: "#18bcc7",
                                confirmButtonText: "Listo",
                        });

          submitBTN.innerText = "Enviado!";
          submitBTN.setAttribute("data-text", "Enviado!");
        },
        function (err) {
          submitBTN.innerText = "Error";
          submitBTN.setAttribute("data-text", "Error");

          Swal.fire({
            title: "¡Ha ocurrido un error!",
            text: "Contactese con info@dreamlabs.com.ar",
            icon: "error",
            confirmButtonText: "Listo",
          });
        }
      );
    }
    });
})

