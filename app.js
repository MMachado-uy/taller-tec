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
        $.ajax({
            url: "http://api.openweathermap.org/data/2.5/weather",
            type: "GET",
            dataType: "json",
            data: {q: 'Montevideo', appid: "1573c2baa2cfe07cb8ee524834829651", lang: "es", units: "metric"},
            success: function(response){
                console.log("success",response);
            },error: function(response){
                console.log("error",response);
                $("#mensaje").text("No hay nadie!");
            }
        });       
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
    $('#login .login').on('submit', login)   
}

function login(e) {
    sanitizeEvt(e);
    
    var form = e.target;
    var email = $(form.email).val();
    var password = $(form.password).val();

    $.ajax({
        url: `${api}/login`,
        type: 'GET',
        dataType: 'json',
        data: {
            email,
            password
        },
    })
    .done(function(e) {
        console.log("Done ->", e);
    })
    .fail(function(e) {
        console.log("Fail ->", e);

        $('#errLogin .msg').html(e.responseText);
        $('#errLogin').popup( "open" )
    })
    .always(function(e) {
        console.log("Always ->", e);
        // Mover al Done ###################################################
        $.mobile.navigate('#inicio')
    });
}

function showLoader() {
    console.log('loader')
//     var $this = $(this),
//         msgText = '',
//         textVisible = false,
//         textonly = false;
//         html = '';
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