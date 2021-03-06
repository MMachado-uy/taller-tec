const api = 'http://medicort.tribus.com.uy';
const mapsAPI = 'AIzaSyD5yvc9GHlDhrlMBfiIEYgPP9aYR-tZFj4';

$(document)
.on('pageinit', init)
.on('pagebeforeshow', '#login', function(e, data) {
    sessionStorage.removeItem('loggedUser');
})
.on('pagebeforeshow', '#inicio', function(e, data) {
    if (!isUserLogged()) $.mobile.navigate('#login');
    else loadWelcome();
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
    else listarConsultas();
})
.on('pagebeforeshow', '#nuevaConsulta', function(e, data) {
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

    if ("geolocation" in navigator) {
        /* la geolocalización está disponible */
        navigator.geolocation.getCurrentPosition(function(res) {

            console.log('Geo cargada')

            sessionStorage.setItem('lat', res.coords.latitude)
            sessionStorage.setItem('lon', res.coords.longitude)
        }, function(err) {
            console.log('Geolocation error: ', err)
        });
    }

    $('.gotoRegistro').click(gotoRegistro);
    $('.backFromRegistro').click(backFromRegistro);
    $('.backFromConsulta').click(backFromConsulta);
    $('#medicos .solo-fav').click(soloFav);
    $('#med-calif').click(abrirCalificarMedico);
    $('#submit-calif').click(puntuarMedico);
    $('#login .login').on('submit', login);
    $('#altaUsuario .register').on('submit', altaUsuario);
    $('#fav-ico').click(toggleMedicoFavorito);
    $('#newSchedule').on('submit', guardarConsulta);
    $('#goToConsulta').click(prepararConsulta);
}

////////////////////////////////////////////////////////////////////////////////
// Metodos de la aplicacion
////////////////////////////////////////////////////////////////////////////////

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
        sessionStorage.setItem('loggedUser', JSON.stringify(res));
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

    sessionStorage.removeItem('loggedUser');
    $.mobile.navigate()
}

function loadWelcome() {
    var loggedUser = JSON.parse(sessionStorage.getItem('loggedUser'));
    $('#bienvenida').html(`Bienvenido, ${loggedUser.nombre}`);
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
        $('#errRegistro').popup( "open" );
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
                        <a class="medico ${fav ? 'fav' : ''}" onClick="verMedico(this)" data-transition="none" href="#" profId="${profesional.id}" nom="${profesional.nombre}" ape="${profesional.apellido}">
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

        sessionStorage.setItem('medicoActual', JSON.stringify(medico))

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
    var usuarioActual = JSON.parse(sessionStorage.getItem('loggedUser')).id_usuario;
    var favoritos = JSON.parse(localStorage.getItem('medicosFavoritos'));

    if (favoritos.length > 0 && favoritos[usuarioActual] !== null) {
        var favoritosUsuario = favoritos[usuarioActual]
        while (!encontrado && i < favoritosUsuario.length) {
            encontrado = favoritosUsuario[i].nom === medico.nom && favoritosUsuario[i].ape === medico.ape;
            if (!encontrado) i++;
        }

        if (encontrado) {
            favoritosUsuario.splice(i, 1);
        } else {
            favoritosUsuario.push(medico);
        }

        favoritos[usuarioActual] = favoritosUsuario;

        // Icono Popup
        $('#fav-ico img').attr({
            src: (encontrado) ? 'assets/star-clear.png' : 'assets/star-fill.png'
        })

        // Icono Lista gral
        $(`#listaMedicosGral li a[nom='${medico.nom}'][ape='${medico.ape}']`)
        .toggleClass('fav');

        localStorage.setItem('medicosFavoritos', JSON.stringify(favoritos));
    } else {
        favoritos[usuarioActual] = [medico];
        localStorage.setItem('medicosFavoritos', JSON.stringify(favoritos));

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
    var usuarioActual = JSON.parse(sessionStorage.getItem('loggedUser')).id_usuario;

    if (favoritos.length > 0 && favoritos[usuarioActual] !== null) {
        var favoritosUsuario = favoritos[usuarioActual];

        while (!encontrado && i < favoritosUsuario.length) {
            encontrado = favoritosUsuario[i].nom === nombre && favoritosUsuario[i].ape === apellido;
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
    var lat = parseFloat($(filaCentro).attr('lat'));
    var lon = parseFloat($(filaCentro).attr('lon'));
    var location = {
        lat: parseFloat(sessionStorage.getItem('lat')),
        lon: parseFloat(sessionStorage.getItem('lon'))
    }

    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsService = new google.maps.DirectionsService;
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: {lat: lat, lng: lon}
    });

    if (location.lat != null && location.lon != null) {
        directionsDisplay.setMap(map);
        calculateAndDisplayRoute(directionsService, directionsDisplay, lat, lon, location);
    }

    $('#cen-direccion').html($(filaCentro).attr('dir'));
    $('#cen-nombre').html($(filaCentro).attr('nom'));

    $('#verCentro').popup('open');
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, dlat, dlon, origin) {
    var selectedMode = "DRIVING";

    directionsService.route({
        origin: {
            lat: origin.lat,
            lng: origin.lon
        },
        destination: {
            lat: dlat,
            lng: dlon
        },
        travelMode: google.maps.TravelMode[selectedMode]
    }, function(response, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function prepararConsulta(e) {
    sanitizeEvt(e);

    var medico = JSON.parse(sessionStorage.getItem('medicoActual'));
    var currentUser = JSON.parse(sessionStorage.getItem('loggedUser'));

    $('#sche-email').html(currentUser.email);
    $('#sche-medico').html(`${medico.apellido}, ${medico.nombre}`);
    $('#sche-centro').html(medico.centroMedico.nombre);

    $.mobile.navigate('#nuevaConsulta');
}

function guardarConsulta(e) {
    sanitizeEvt(e);

    var currentUser = JSON.parse(sessionStorage.getItem('loggedUser'));
    var medicoActual = JSON.parse(sessionStorage.getItem('medicoActual'));

    var email = currentUser.email;
    var medico = medicoActual.id;
    var centro = medicoActual.centroMedico.id;
    var fecha = $('#sche-fecha').val();

    var f = new Date(fecha);
    fecha = `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()} ${f.getHours()}:${f.getMinutes()}`;

    var payload = {
        email: email,
        fechaHora: fecha,
        idProfesional: medico,
        idCentroMedico: centro
    }

    showLoader();

    $.ajax({
        url: `${api}/fijarConsultaMedica`,
        type: 'POST',
        dataType: 'json',
        data: payload
    })
    .done(function(res) {
        $('#exitoConsulta').popup( "open" );
        $('#sche-fecha').val('');
        redirectToListaConsultas();
    })
    .fail(function(res) {
        $('#errConsulta').popup( "open" );
    })
    .always(function(res) {
        hideLoader();
    })
}

function redirectToListaConsultas() {
    var countdownNumberEl = $('#countdown-number');
    var countdown = 5;

    countdownNumberEl.textContent = countdown;

    var loop = setInterval(function() {
    countdown = --countdown <= 0 ? 5 : countdown;

    if (countdown === 1) {
        $.mobile.navigate('#consultas');
        clearInterval(loop);
    }

    countdownNumberEl.textContent = countdown;
    }, 1000);
}

function listarConsultas() {
    showLoader();

    var usuario = JSON.parse(sessionStorage.getItem('loggedUser'));

    $.ajax({
        url: `${api}/getHistorialConsultasMedicas`,
        type: 'GET',
        dataType: 'json',
        data: {
            email: usuario.email
        }
    })
    .done(function(res) {
        var lista = $('#listadoConsultas');
        var consultas = res.consultasMedicas;
        var items = '';

        consultas.forEach(function(consulta) {
            items += `
                <div data-role="collapsible">
                    <h3>    ${consulta.centroMedico.nombre}</h3>
                    <p>${consulta.profesional.apellido}, ${consulta.profesional.nombre}</p>
                    <p>${consulta.profesional.especialidad}</p>
                </div>
            `
        })

        $(lista).html(items);
        $(lista).collapsibleset('refresh');
    })
    .fail(function() {
        $('#errConsultas').popup('open');
    })
    .always(function() {
        hideLoader();
    })
}

function showLoader() {
    $.mobile.loading("show")
}

function hideLoader() {
    $.mobile.loading("hide")
}

function isUserLogged() {
    return sessionStorage.getItem('loggedUser') !== null;
}

function gmapload() {
    console.log('Google Maps lib loaded')
}

function gotoRegistro(e) {
    sanitizeEvt(e);

    sessionStorage.setItem('navHist', window.location.hash)
    $.mobile.navigate('#altaUsuario');
}

function backFromRegistro(e) {
    sanitizeEvt(e);

    navHist = sessionStorage.getItem('navHist');
    sessionStorage.removeItem('navHist');
    $.mobile.navigate(navHist);
}

function backFromConsulta(e) {
    sanitizeEvt(e);

    $.mobile.navigate('#medicos');
}

function sanitizeEvt(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
}
