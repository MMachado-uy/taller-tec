// medicort.tribus.com.uy
$(document).on('pageinit', init)

$(document).on('pagebeforeshow', '#inicio', function(e, data){      
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
});

$(document).on('pagebeforeshow', '#medicos', function(e, data){      
       
});

$(document).on('pagebeforeshow', '#centros', function(e, data){      
      
});

$(document).on('pagebeforeshow', '#consultas', function(e, data){      
       
});

function init() {
  
}
