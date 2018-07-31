// medicort.tribus.com.uy
$(document)
.on('pageinit', init)
.on('pagebeforeshow', '#login', function(e, data){      
    $('#login .login').on('submit', function(e) {
        e.preventDefault();
        console.log(e);

        jQuery.mobile.navigate('#inicio')
    })       
})
.on('pagebeforeshow', '#inicio', function(e, data){      
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
})
.on('pagebeforeshow', '#usuarios', function(e, data){      
    $('.verUsuario').on('click', function(e) {
        e.preventDefault();

        $("#verUsuario").popup("open");
    });
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
       
});

function init() {

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