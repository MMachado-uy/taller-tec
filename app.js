const api = 'http://medicort.tribus.com.uy';
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
})
.on('pagebeforeshow', '#consultas', function(e, data) {      
    if (!isUserLogged()) $.mobile.navigate('#login');
})
.on('pagebeforeshow', '#altaUsuario', function(e, data) {      
});

function init() {
    $('.gotoRegistro').click(gotoRegistro);
    $('.backFromRegistro').click(backFromRegistro);
    
    // Login listener
    $('#login .login').on('submit', login);

    // Adduser listener
    $('#altaUsuario .register').on('submit', altaUsuario);
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
        $.mobile.navigate('#inicio')
    })
    .fail(function(res) {
        $('#errLogin').popup( "open" )
    })
    .always(function (res) {
        $('#login .login button').attr('disabled', false);
        hideLoader();
    })
}

function logout(e) {
    sanitizeEvt();

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
    sanitizeEvt();

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
        console.log("res", res);
        var profesionales = res.profesionales;

        if (profesionales.length) {
            var lista = '';

            profesionales.forEach(function(profesional) {
                lista += `<li><a onClick="verMedico(this)" data-transition="none" href="#">${profesional.apellido}, ${profesional.nombre}</a></li>`;
            });
        } else {
            lista = '<li>No existen medicos registrados :(</li>';
        }

        $('#listaMedicosGral').html(lista);
        $('#listaMedicosGral').listview('refresh');
    })
    .fail(function(res) {
    })
    .always(function (res) {
        hideLoader();
    })
}

function verMedico(that) {
    console.log($(that));
}

function showLoader() {
    $.mobile.loading("show");
}

function hideLoader() {
    $.mobile.loading("hide");
};

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