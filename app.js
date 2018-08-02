const api = 'http://medicort.tribus.com.uy';
var loggedUser = null;
var navHist = '';

$(document)
.on('pageinit', init)
.on('pagebeforeshow', '#login', function(e, data){

})
.on('pagebeforeshow', '#inicio', function(e, data){
    if (isUserLogged()) {
        // STUFF
        ////////////////////////////////////////////////////////////////////////  
    } else {
        $.mobile.navigate('#login')
    }
})
.on('pagebeforeshow', '#usuarios', function(e, data){
    if (isUserLogged()) {
        $('.verUsuario').on('click', function(e) {
            e.preventDefault();

            $("#verUsuario").popup("open");
        });
    } else {
        $.mobile.navigate('#login')   
    }
})
.on('pageshow', '#medicos', function(e, data){      
    showLoader();
})
.on('pagechange', '#medicos', function(e, data) {
    hideLoader();
})
.on('pagebeforeshow', '#centros', function(e, data){      
      
})
.on('pagebeforeshow', '#consultas', function(e, data){      
       
})
.on('pagebeforeshow', '#altaUsuario', function(e, data){      
    
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
    .done(function() {
        $.mobile.navigate('#inicio')
    })
    .fail(function(e) {
        $('#errLogin').popup( "open" )
    })
    .always(function (e) {
        $('#login .login button').attr('disabled', false);
        hideLoader();
    })
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
    .done(function() {
        $('#exitoRegistro').popup( "open" )
        
        $(form.email).val('');
        $(form.password).val('');
        $(form.name).val('');
        $(form.lastname).val('');
        $(form.documento).val('');
        $(form.telefono).val('');
    })
    .fail(function(e) {
        $('#errRegistro').popup( "open" )
    })
    .always(function (e) {
        $('#altaUsuario .register button').attr('disabled', false);
        hideLoader();
    })
}

function showLoader() {
    $.mobile.loading("show");
}

function hideLoader() {
    $.mobile.loading("hide");
};

function isUserLogged() {
    // return loggedUser !== null;
    return true;
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