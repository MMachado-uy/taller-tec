const api = 'http://medicort.tribus.com.uy';
const mapsAPI = 'AIzaSyD5yvc9GHlDhrlMBfiIEYgPP9aYR-tZFj4';
var loggedUser = null;
var navHist = '';

$(document)
.on('pageinit', init)
.on('pagebeforeshow', '#login', function(e, data) {})
.on('pagebeforeshow', '#inicio', function(e, data) {
    if (isUserLogged()) {
        $('#bienvenida').html(`Bienvenido, ${loggedUser.id_usuario}`);
    } else {
        $.mobile.navigate('#login')
    }
})
.on('pagebeforeshow', '#medicos', function(e, data) {
    if (!isUserLogged()) $.mobile.navigate('#login');
    else getMedicos();
})
.on('pagebeforeshow', '#centros', function(e, data) {
    if (!isUserLogged()) $.mobile.navigate('#login');
    else getCentros();
})
.on('pagebeforeshow', '#consultas', function(e, data) {
    if (!isUserLogged()) $.mobile.navigate('#login');
})
.on('pagebeforeshow', '#altaUsuario', function(e, data) {
});

// Inicializar event listeners
function init() {
    var favoritos = localStorage.getItem('medicosFavoritos');
    if (favoritos === null) {
        favoritos = [];
        localStorage.setItem('medicosFavoritos', JSON.stringify(favoritos));
    }

    $('.gotoRegistro').click(gotoRegistro);
    $('.backFromRegistro').click(backFromRegistro);

    // Filtro de medicos favoritos listener
    $('#medicos .solo-fav').click(soloFav);

    // Calificar listeners
    $('#med-calif').click(abrirCalificarMedico);
    $('#submit-calif').click(puntuarMedico);

    // Login listener
    $('#login .login').on('submit', login);

    // Adduser listener
    $('#altaUsuario .register').on('submit', altaUsuario);

    $('#fav-ico').click(toggleMedicoFavorito);
}

function login(e) {
    sanitizeEvt(e);

    $('#login .login button').attr('disabled', 'disabled');
    showLoader();

    var form = e.target;
    var email = $(form.email).val();
    var password = $(form.password).val();

    var payload = {
        email,
        password
    };

    $.ajax({
        url: `${api}/login`,
        type: 'GET',
        dataType: 'json',
        data: payload,
    })
    .done(function(res) {
        loggedUser = res;
        $.mobile.navigate('#inicio');
    })
    .fail(function(res) {
        $('#errLogin').popup( "open" );
    })
    .always(function (res) {
        $('#login .login button').attr('disabled', false);
        hideLoader();
    })
}

function logout(e) {
    sanitizeEvt(e);

    loggedUser = null;
}

function altaUsuario(e) {
    sanitizeEvt(e);

    $('#altaUsuario .register button').attr('disabled', 'disabled');
    showLoader();

    var form = e.target;
    var email = $(form.email).val();
    var password = $(form.password).val();
    var nombre = $(form.name).val();
    var apellido = $(form.lastname).val();
    var documento = $(form.documento).val();
    var telefono = $(form.telefono).val();

    var payload = {
        email,
        password,
        nombre,
        apellido,
        documento,
        telefono
    }

    $.ajax({
        url: `${api}/registrar`,
        type: 'POST',
        dataType: 'json',
        data: payload,
    })
    .done(function(res) {
        $('#exitoRegistro').popup( "open" )

        $(form.email).val('');
        $(form.password).val('');
        $(form.name).val('');
        $(form.lastname).val('');
        $(form.documento).val('');
        $(form.telefono).val('');

        $.mobile.navigate('#login');
    })
    .fail(function(res) {
        $('#errRegistro').popup( "open" )
    })
    .always(function (res) {
        $('#altaUsuario .register button').attr('disabled', false);
        hideLoader();
    })
}

function verUsuario(e) {
    sanitizeEvt(e);

    $("#verUsuario").popup("open");
}

function getMedicos() {
    showLoader();

    $.ajax({
        url: `${api}/getProfesionales`,
        type: 'GET',
        dataType: 'json'
    })
    .done(function(res) {
        var profesionales = res.profesionales;

        if (profesionales.length) {
            var lista = '';

            profesionales.forEach(function(profesional) {
                var fav = esMedicoFavorito(profesional.nombre, profesional.apellido);

                lista += `
                    <li>
                        <a class="medico ${fav ? 'fav' : ''}" onClick="verMedico(this)" data-transition="none" href="#" nom="${profesional.nombre}" ape="${profesional.apellido}">
                            ${profesional.apellido}, ${profesional.nombre}
                            <span class="text-light text-italic right">${profesional.especialidad}</span>
                        </a>
                    </li>
                `;
            });
        } else {
            lista = '<li>No existen medicos registrados :(</li>';
        }

        $('#listaMedicosGral').html(lista);

        // Favoritos Primero
        var list = $('#listaMedicosGral').find('li').sort(sortMe);
        function sortMe(a, b) {
            return !$(a).children().hasClass('fav') && $(b).children().hasClass('fav');
        }
        $('#listaMedicosGral').append(list);

        $('#listaMedicosGral').listview('refresh');
    })
    .fail(function(res) {
    })
    .always(function (res) {
        hideLoader();
    })
}

function verMedico(filaMedico) {
    showLoader();

    var nombre = $(filaMedico).attr('nom');
    var apellido = $(filaMedico).attr('ape');

    $.ajax({
        url: `${api}/getDetalleProfesional`,
        type: 'GET',
        dataType: 'json',
        data: {
            nombre,
            apellido
        }
    })
    .done(function(res) {
        var medico = res.profesional;
        var avatar = (medico.foto === '') ? 'assets/avatar.png' : medico.foto;
        var fav = esMedicoFavorito(medico.nombre, medico.apellido);

        $('#med-avatar').attr('src', avatar);
        $('#med-nombre').html(medico.nombre);
        $('#med-apellido').html(medico.apellido);
        $('#med-especialidad').html(medico.especialidad);
        $('#med-titulo').html(medico.titulo);
        $('#med-puntuacion').html(medico.puntuacion.toFixed(0));

        $('#fav-ico img').attr({
            src: (fav) ? 'assets/star-fill.png' : 'assets/star-clear.png'
        })

        $('#verMedico').popup("open");
    })
    .fail(function(res) {

    })
    .always(function(res) {
        hideLoader();
    })
}

function toggleMedicoFavorito(e) {
    sanitizeEvt(e);

    var medico = {
        nom: $('#med-nombre').html(),
        ape: $('#med-apellido').html()
    }
    var encontrado = false;
    var i = 0;
    var favoritos = JSON.parse(localStorage.getItem('medicosFavoritos'));

    if (favoritos.length > 0) {
        while (!encontrado && i < favoritos.length) {
            encontrado = favoritos[i].nom === medico.nom && favoritos[i].ape === medico.ape;
            if (!encontrado) i++;
        }

        if (encontrado) {
            favoritos.splice(i, 1);
        } else {
            favoritos.push(medico);
        }

        // Icono Popup
        $('#fav-ico img').attr({
            src: (encontrado) ? 'assets/star-clear.png' : 'assets/star-fill.png'
        })

        // Icono Lista gral
        $(`#listaMedicosGral li a[nom='${medico.nom}'][ape='${medico.ape}']`)
        .toggleClass('fav');

        localStorage.setItem('medicosFavoritos', JSON.stringify(favoritos));
    } else {
        localStorage.setItem('medicosFavoritos', JSON.stringify([medico]));

        // Icono Popup
        $('#fav-ico img').attr({
            src: 'assets/star-fill.png'
        })

        // Icono Lista gral
        $(`#listaMedicosGral li a[nom='${medico.nom}'][ape='${medico.ape}']`)
        .addClass('fav');
    }
}

function esMedicoFavorito(nombre, apellido) {
    var encontrado = false;
    var i = 0;
    var favoritos = JSON.parse(localStorage.getItem('medicosFavoritos'));

    if (favoritos.length > 0) {
        while (!encontrado && i < favoritos.length) {
            encontrado = favoritos[i].nom === nombre && favoritos[i].ape === apellido;
            if (!encontrado) i++;
        }

        return encontrado;
    } else {
        return false;
    }
}

function soloFav(e) {
    sanitizeEvt(e);

    var page = $(e.target).closest('div[data-role="page"]').attr('id');

    if ($(e.target).prop('checked')) {
        $(`#${page} ul[data-role="listview"] li a`).not('.fav').closest('li').hide();
    } else {
        $(`#${page} ul[data-role="listview"] li a`).not('.fav').closest('li').show();
    }
}

function abrirCalificarMedico(e) {

    $('#verMedico').popup("close");

    $('#verMedico').on('popupafterclose', function() {

        // Unbind evt listener
        $('#verMedico').off('popupafterclose');

        var medico = {
            nom: $('#med-nombre').html(),
            ape: $('#med-apellido').html()
        }
        var nombre = `${medico.nom} ${medico.ape}`;

        $('#calif-nombre').html(nombre);
        $('#calificacion-slide').val($('#med-puntuacion').html());
        $('#calificacion-slide').slider('refresh');

        $('#califMedico').popup("open");
    })
}

function puntuarMedico(e) {
    sanitizeEvt(e);
    showLoader();

    $('#submit-calif').attr('disabled', 'disabled');

    var nombre = $('#med-nombre').html();
    var apellido = $('#med-apellido').html();
    var puntaje = $('#calificacion-slide').val();

    $.ajax({
        url: `${api}/asignarPuntajeAProfesional`,
        type: 'POST',
        dataType: 'json',
        data: {
            nombre,
            apellido,
            puntaje
        }
    })
    .done(function(res) {
        console.log("DONE res >>>>", res);
        // Done
    })
    .fail(function(res) {
        console.log("FAIL res >>>>", res);
        // Fail
    })
    .always(function(res) {
        hideLoader();
        $('#submit-calif').attr('disabled', false);
        $('#califMedico').popup("close");
    })
}

function getCentros() {
    showLoader();

    $.ajax({
        url: `${api}/getCentrosMedicos`,
        type: 'GET',
        dataType: 'json'
    })
    .done(function(res) {
        var centrosMedicos = res.centrosMedicos;

        if (centrosMedicos.length) {
            var lista = '';

            centrosMedicos.forEach(function(centro) {
                lista += `
                    <li>
                        <a class="centro" onClick="verCentro(this)" data-transition="none" href="#" nom="${centro.nombre}" dir="${centro.direccion}" lat="${centro.localizacion.latitud}" lon="${centro.localizacion.longitud}">
                            ${centro.nombre}
                            <span class="text-light text-italic right">${centro.direccion}</span>
                        </a>
                    </li>
                `;
            });
        } else {
            lista = '<li>No existen centros medicos registrados :(</li>';
        }

        $('#listaCentrosGral').html(lista);

        $('#listaCentrosGral').listview('refresh');
    })
    .fail(function(res) {

    })
    .always(function(res) {
        hideLoader();
    })
}

function verCentro(filaCentro) {
    var lat = -34.9065866//parseFloat($(filaCentro).attr('lat'));
    var lon = -56.1994113//parseFloat($(filaCentro).attr('lon'));

    var map = L.map('map',{
        center: [lat, lon],
        zoom: 13
    });//.setView([lat, lon], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibW1hY2hhZG8iLCJhIjoiY2pra2d2c3FrMDFhMjN4dGgxczJ5Mjk2MSJ9.q7Rk9IIkfIZAqgDSuX8LUA', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibW1hY2hhZG8iLCJhIjoiY2pra2d2c3FrMDFhMjN4dGgxczJ5Mjk2MSJ9.q7Rk9IIkfIZAqgDSuX8LUA'
    }).addTo(map);
    var marker = L.marker([lat, lon]).addTo(map);

    $('#cen-direccion').html($(filaCentro).attr('dir'));
    $('#cen-nombre').html($(filaCentro).attr('nom'));

    $('#verCentro').popup('open');

}

function showLoader() { $.mobile.loading("show") }

function hideLoader() { $.mobile.loading("hide") }

function isUserLogged() {
    return true;
    // return loggedUser !== null;
}

function gotoRegistro(e) {
    sanitizeEvt(e);

    navHist = window.location.hash;
    $.mobile.navigate('#altaUsuario');
}

function backFromRegistro(e) {
    sanitizeEvt(e);

    $.mobile.navigate(navHist);
    navHist = '';
}

function sanitizeEvt(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
}