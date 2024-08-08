let prevScrollpos = window.pageYOffset;
let isAtTop = true;

window.onscroll = function() {
    let currentScrollPos = window.pageYOffset;
    const navbar = document.getElementById("navbar");

    if (currentScrollPos === 0) {
        isAtTop = true;
    } else {
        isAtTop = false;
    }

    if (!isAtTop && prevScrollpos < currentScrollPos) {
        navbar.style.top = "-100px"
        navbar.classList.remove('navbar-background')
    } else {
        navbar.style.top = "0"
        navbar.classList.add('navbar-background')
    }
    prevScrollpos = currentScrollPos;
}