var informacion_capa_servicio = "/siata_nuevo/index.php/capa_service/consultar_capa_carga";
var informacion_capa_servicio_busqueda = "/siata_nuevo/index.php/capa_service/consultar_capa_busqueda";
var consultar_restricciones_servicio = "/siata_nuevo/index.php/capa_service/generar_array_restricciones_capas_por_rol";
var valor_capa_raster_capa_servicio = "/siata_nuevo/index.php/capa_service/consultar_valor_capa_raster";
var guardar_preferencias_servicio = "/siata_nuevo/index.php/preferencias_service/guardar_preferencias";
var borrar_preferencias_servicio = "/siata_nuevo/index.php/preferencias_service/borrar_preferencias";
var cargar_preferencias_servicio = "/siata_nuevo/index.php/preferencias_service/cargar_preferencias";
var guardar_peticiones_servicio = "/siata_nuevo/index.php/peticion_service/guardar_peticion";
var url_message = "/siata_nuevo/index.php/message/getMessage";


var timer_preferencias;
var preferenciasDeUsuario = {};
//var nombre_widget_array = [];

var capas_array = {};
var capas_raster_array = {};
var capas_vector_array = {};
var capas_point_array = {};
var capas_aire_array = [];

var id_capas_busqueda_array = {};
var id_capas_carga_array = {};
var valores_busqueda = {};
valores_busqueda["nombre_capa"] = [];
valores_busqueda["nombre_feature"] = [];
var LatLng_capas = {};
var latitud = "-999";
var longitud = "-999";

function addMarker(map_obj, position) {
    map_obj.removeMarkers();
    map_obj.addMarker({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        title: 'Mi Ubicacion',
        click: function (e) { }
    });
}

function alertError(messageType) {
    $.post(url_message, { 'messageType': messageType },
        function (data) {
            $.alert({
                title: '',
                content: data.fontcolor("black"),
                confirmButton: 'OK',
                confirm: function () {
                }
            });
        });
}

function mostrar_valor_capas_raster_callback(event) {
    var lat_lng_obj = event.latLng;
    var latitud = lat_lng_obj.lat();
    var longitud = lat_lng_obj.lng();

    var latr = Math.round(latitud * 100000) / 100000;
    latr = latr.toFixed(5);
    var lngr = Math.round(longitud * 100000) / 100000;
    lngr = lngr.toFixed(5);

    $('#toolbar_lat').html(latr);
    $('#toolbar_long').html(lngr);

    var str_text = "";
    str_text = latitud + " , " + longitud + "</br>";
}

function inicializar_mouseover_raster_callback(target_obj, f_callback) {
    google.maps.event.addListener(target_obj, 'mouseover', f_callback);
    google.maps.event.addListener(target_obj, 'mouseout', f_callback);
    google.maps.event.addListener(target_obj, 'mousemove', f_callback);

}

function inicializar_zoom_changed_capa_point(map) {
    google.maps.event.addListener(map, 'zoom_changed', function () {
        var zoom = map.getZoom();

        $.each(capas_point_array, function (id_capa, parametros_array) {
            if (!parametros_array["peticion_usuario"]) {
                if (parseInt(zoom) < parseInt(parametros_array["zoom"])) {
                    if ($("#" + id_capa + "capa_check").prop("checked")) {
                        capas_point_array[id_capa]["peticion_zoom"] = true;
                        $("#" + id_capa + "capa_check").click();
                    }
                }
                else {
                    if (!$("#" + id_capa + "capa_check").prop("checked")) {
                        capas_point_array[id_capa]["peticion_zoom"] = true;
                        $("#" + id_capa + "capa_check").click();
                    }
                }
            }
        });
    });
}

function visualizar_capa(mapa_obj, id_capa, sw_visualizar, sw_panel_seleccion, sw_actualizacion, sw_cuenca_asociada) {
    if (sw_visualizar) {
        $.ajax({
            url: informacion_capa_servicio,
            type: "POST",
            dataType: "json",
            data: { "id_capa": id_capa },
            async: true,
            success: function (data) {
                if (data["status"] == "ok") {
                    if (sw_actualizacion) {
                        eliminar_capa(capas_array[id_capa], id_capa, true);
                    }

                    capas_array[data["id_capa"]] = {};

                    if (data["nombre_tipo_capa"] == "Raster") {
                        cargar_feature_raster(data["feature_raster"], mapa_obj, data["id_capa"], data["nombre"], sw_actualizacion);
                    }
                    else {
                        cargar_feature_vector(data["feature_vector"], mapa_obj, data["id_capa"], data["nombre"], data["cargar_kml"], data["url"], false, sw_actualizacion);
                    }

                    if (sw_panel_seleccion && !sw_actualizacion) {
                        if (!capas_array[id_capa]['kml_carga']) {

                            agregar_panel_seleccion_capa(id_capa, data["nombre"]);
                        }

                        var capas_raster_panel = ["C_00000000000000000000719", "C_00000000000000000000718", "C_00000000000000000000717", "C_00000000000000000000716", "C_00000000000000000000715", "C_00000000000000000001105", "C_00000000000000000001106"];
                        var index = capas_raster_panel.indexOf(id_capa);

                        if (index != -1) {
                            if (!$("#capas_informacion_li").is(".active")) {
                                toggle_panel_class("capas_detalle_li", "active");
                                toggle_panel_class("capas_detalle", "active");
                                toggle_panel_class("capas_informacion_li", "active");
                                toggle_panel_class("capas_informacion", "active");
                            }
                        }
                    }

                    if (($("#mapa_info_panel").has("[id$=panel]").length) && !($("#mapa_info_panel").is(":visible")) && !sw_actualizacion) {
                        $("#collapse_info_panel_span").click();
                    }

                    if (!(data["id_capa"] in id_capas_carga_array)) {
                        id_capas_carga_array[data["id_capa"]] = {};
                        id_capas_carga_array[data["id_capa"]]["estatica"] = data["estatica"];
                        id_capas_carga_array[data["id_capa"]]["cargar_kml"] = data["cargar_kml"];
                        id_capas_carga_array[data["id_capa"]]["tiene_leyenda"] = data["tiene_leyenda"];
                        id_capas_carga_array[data["id_capa"]]["url_leyenda"] = data["url_leyenda"];
                        id_capas_carga_array[data["id_capa"]]["nombre"] = data["nombre"];
                        id_capas_carga_array[data["id_capa"]]["zoom"] = data["zoom"];
                        id_capas_carga_array[data["id_capa"]]["estado_capa"] = "activate";

                        if (data["cargar_kml"]) {
                            id_capas_carga_array[data["id_capa"]]["tipo_capa"] = "kml";

                            if (!is_mobile) {
                                setTimeout(function () {
                                    legends_set_params({ 'action': id_capas_carga_array[data["id_capa"]]["estado_capa"], 'value': data["id_capa"] });
                                }, 10000);
                            }

                        }
                        else {
                            if (data["nombre_tipo_capa"] == 'Raster') {
                                id_capas_carga_array[data["id_capa"]]["tipo_capa"] = data["nombre_tipo_capa"];
                            }
                            else {
                                geometria = $.parseJSON(data["feature_vector"][0].geometry_text);

                                tipo = obtener_tipo_capa_vector(geometria);

                                id_capas_carga_array[data["id_capa"]]["tipo_capa"] = tipo;
                            }

                            if (!is_mobile) {
                                legends_set_params({ 'action': id_capas_carga_array[data["id_capa"]]["estado_capa"], 'value': data["id_capa"] });
                            }
                        }
                    }

                    $("#" + data["id_capa"] + "capa_menu_check").prop("checked", true);

                    var capas_incendios_panel_modis = ["C_00000000000000000001030", "C_00000000000000000001031", "C_00000000000000000001032"];
                    var index_modis = capas_incendios_panel_modis.indexOf(data["id_capa"]);
                    var capas_incendios_panel_viirs = ["C_00000000000000000001132", "C_00000000000000000001133", "C_00000000000000000001134"];
                    var index_viirs = capas_incendios_panel_viirs.indexOf(data["id_capa"]);
                    if (index_modis != -1 && !($("#" + data["id_capa"] + "info_panel_body").length > 0)) {
                        var texto_modis = '<p>Los puntos rojos corresponden a las anomalÃ­as tÃ©rmicas observados cada dÃ­a por el sensor MODIS (<a href="https://modis.gsfc.nasa.gov/" target="_blank">https://modis.gsfc.nasa.gov/ </a>)  a bordo de los satÃ©lites Terra y Aqua de la NASA en pixeles de 1km de resoluciÃ³n, la NASA suministra para cada punto la probabilidad de que se trate de un incendio o quema, En este caso se muestran aquellos con una probabilidad mayor al 95%, para reducir la incertidumbre respecto a si estos focos de calor corresponden o no a incendios. La NASA dispone de un portal web (<a href="https://firms.modaps.eosdis.nasa.gov/map/" target="_blank">https://firms.modaps.eosdis.nasa.gov/map/</a>) donde tambiÃ©n se pueden observar estos focos de calor, pero sin ser filtrados por probabilidad.</p>';
                        crear_panel_detalle_feature_vector("capas_informacion", data["id_capa"], data["nombre"], data["id_capa"], true);
                        crear_contenido_panel_descripcion_incendios(data["id_capa"] + "info_panel_body", data["nombre"], data["id_capa"], texto_modis);
                        if (!$("#capas_informacion_li").is(".active")) {
                            toggle_panel_class("capas_detalle_li", "active");
                            toggle_panel_class("capas_detalle", "active");
                            toggle_panel_class("capas_informacion_li", "active");
                            toggle_panel_class("capas_informacion", "active");
                        }
                    }
                    else if (index_viirs != -1 && !($("#" + data["id_capa"] + "info_panel_body").length > 0)) {
                        var texto_viirs = '<p>Los puntos amarillos corresponden a las anomalÃ­as tÃ©rmicas observados cada dÃ­a por el sensor VIIRS (<a href="https://www.jpss.noaa.gov/viirs.html" target="_blank">https://www.jpss.noaa.gov/viirs.html</a>) a bordo del satÃ©lite Suomi NPP de la NASA en pixeles de 375m de resoluciÃ³n. Los datos VIIRS complementan las detecciones de incendios MODIS, pero la resoluciÃ³n espacial mejorada de los datos de 375 m proporciona una mayor respuesta de incendios en Ã¡reas relativamente pequeÃ±as y ha mejorado el rendimiento nocturno. Estos puntos estÃ¡n clasificados en tres categorÃ­as (baja, nominal y alta), en este caso se muestran los clasificados en la categorÃ­a â€œaltaâ€ para reducir la incertidumbre respecto a si estos focos de calor corresponden o no a incendios. La NASA dispone de un portal web (<a href="https://firms.modaps.eosdis.nasa.gov/map/l" target="_blank">https://firms.modaps.eosdis.nasa.gov/map/</a>) donde tambiÃ©n se pueden observar estos focos de calor, pero sin ser filtrados por probabilidad.</p>';
                        crear_panel_detalle_feature_vector("capas_informacion", data["id_capa"], data["nombre"], data["id_capa"], true);
                        crear_contenido_panel_descripcion_incendios(data["id_capa"] + "info_panel_body", data["nombre"], data["id_capa"], texto_viirs);
                        if (!$("#capas_informacion_li").is(".active")) {
                            toggle_panel_class("capas_detalle_li", "active");
                            toggle_panel_class("capas_detalle", "active");
                            toggle_panel_class("capas_informacion_li", "active");
                            toggle_panel_class("capas_informacion", "active");
                        }
                    }
                    if (data["zoom"] != '-999' && data["zoom"] != null && !sw_actualizacion) {
                        capas_point_array[data["id_capa"]] = {};
                        capas_point_array[data["id_capa"]]["zoom"] = data["zoom"];
                        capas_point_array[data["id_capa"]]["peticion_usuario"] = false;
                        capas_point_array[data["id_capa"]]["peticion_zoom"] = false;

                        var zoom = mapa_obj.getZoom();

                        if (parseInt(zoom) < parseInt(data["zoom"])) {
                            if ($("#" + id_capa + "capa_check").prop("checked")) {
                                capas_point_array[id_capa]["peticion_zoom"] = true;
                                $("#" + id_capa + "capa_check").click();
                            }
                        }
                        else {
                            if (!$("#" + id_capa + "capa_check").prop("checked")) {
                                capas_point_array[id_capa]["peticion_zoom"] = true;
                                $("#" + id_capa + "capa_check").click();
                            }
                        }
                    }


                    if (sw_cuenca_asociada) {
                        if (!$("#capas_informacion_li").is(".active")) {
                            toggle_panel_class("capas_detalle_li", "active");
                            toggle_panel_class("capas_detalle", "active");
                            toggle_panel_class("capas_informacion_li", "active");
                            toggle_panel_class("capas_informacion", "active");
                        }
                    }


                    if (data["estado_mensaje"] == "A") {
                        if (!sw_actualizacion) {
                            $("#mensaje_error").html(data["mensaje"]);
                            $("#MensajeErrorModal").modal("show");
                        }
                    }
                }
                else {
                    if (id_capa == 'C_00000000000000000000762') {
                        if (!sw_actualizacion) {
                            $("#mensaje_error").html("En este momento no se registran descargas elÃ©ctricas en la zona de cobertura");
                            $("#MensajeErrorModal").modal("show");
                            $("#" + id_capa + "capa_menu_check").prop("checked", false);
                        }
                    }
                    else {
                        if (!sw_actualizacion) {
                            $("#mensaje_error").html(data["message"]);
                            $("#MensajeErrorModal").modal("show");
                        }

                    }

                }
            },
            error: function (request, status, error) {
                error_response_json = {};
                error_response_json_detail = {};
                error_response_json_detail["status"] = status;
                error_response_json_detail["error"] = error;
                error_response_json["error_detail"] = error_response_json_detail;

                response_data = error_response_json;

                if (id_capa == 'C_00000000000000000000762') {
                    if (!sw_actualizacion) {
                        $("#mensaje_error").html("En este momento no se registran descargas elÃ©ctricas en la zona de cobertura");
                        $("#MensajeErrorModal").modal("show");
                        $("#" + id_capa + "capa_menu_check").prop("checked", false);
                    }
                }
                else {
                    if (!sw_actualizacion) {
                        $("#mensaje_error").html("No fue posible obtener la informacion de la capa");
                        $("#MensajeErrorModal").modal("show");
                        $("#" + id_capa + "capa_menu_check").prop("checked", false);
                    }
                }

            }
        });
    }
    else {
        if (id_capa in id_capas_carga_array) {
            delete id_capas_carga_array[id_capa];
        }

        if (id_capa in capas_point_array) {
            delete capas_point_array[id_capa];
        }

        if (id_capa in id_capas_busqueda_array) {
            delete id_capas_busqueda_array[id_capa];

            if (jQuery.isEmptyObject(id_capas_busqueda_array)) {
                valores_busqueda["nombre_capa"] = [];
                valores_busqueda["nombre_feature"] = [];
            }
        }

        if (!is_mobile) {
            legends_set_params({ 'action': 'deactivate', 'value': id_capa });

            if (es_capa_aire(id_capa) && (capas_aire_array.indexOf(id_capa) >= 0)) {
                var index = capas_aire_array.indexOf(id_capa);
                capas_aire_array.splice(index, 1);

                if (capas_aire_array.length < 1) {
                    if ($("#bannerwidget_check").prop("checked")) {
                        $("#bannerwidget_check").click();
                    }
                }
            }
        }
        eliminar_capa(capas_array[id_capa], id_capa, sw_panel_seleccion);

        delete LatLng_capas[id_capa];
        ajustar_zoom(mapa_obj);

        if (!($("#mapa_info_panel").has("[id$=panel]").length > 0) && ($("#mapa_info_panel").is(":visible"))) {
            $("#collapse_info_panel_span").click();
            mapa_obj.setCenter(new google.maps.LatLng(6.250, -75.568));
            mapa_obj.setZoom(12);
        }
        else if (!($("#capas_detalle").has("[id$=panel]").length) && ($("#mapa_info_panel").is(":visible"))) {
            mapa_obj.setCenter(new google.maps.LatLng(6.250, -75.568));
            mapa_obj.setZoom(12);
        }
    }
}

function eliminar_capa(capas_array_x_id, id_capa, sw_panel_seleccion) {
    if (capas_array_x_id['kml_carga']) {
        capas_array_x_id.hideDocument(capas_array_x_id.docs[0]);
    }
    else {
        $.each(capas_array_x_id, function (id_feature, feature_array) {
            $.each(feature_array, function (feature_array_idx, feature_elem) {
                feature_elem.setMap(null);
            });
        });
    }
    if (!sw_panel_seleccion) {
        eliminar_panel_seleccion_capa(id_capa);
        eliminar_paneles_informacion_feature(id_capa);
    }
}

function visualizar_capa_busqueda(mapa_obj, nombre_capa, valor_alfanumerico, sw_actualizacion) {
    var jsonCapasBusquedaArray = JSON.stringify(Object.keys(id_capas_busqueda_array));

    $.ajax({
        url: informacion_capa_servicio_busqueda,
        type: "POST",
        dataType: "json",
        data: { "nombre_capa": nombre_capa, "valor_alfanumerico": valor_alfanumerico, "jsonCapasBusquedaArray": jsonCapasBusquedaArray },
        async: true,
        success: function (data) {
            if (data["status"] == "ok") {
                for (var j = 0, response_length = data["response"].length; j < response_length; j++) {
                    if (sw_actualizacion) {
                        eliminar_capa(capas_array[data["response"][j]["id_capa"]], data["response"][j]["id_capa"], false);
                    }

                    if ((data["response"][j]["id_capa"] in id_capas_carga_array)) {
                        if (valor_alfanumerico == '') {	// INDICA QUE LA CAPA FUE CARGADA Y MARCA EL CHECK DE TODOS LOS FEATURES EN EL PANEL**
                            $.each(capas_array[data["response"][j]["id_capa"]], function (id_feature, feature_array) {
                                $.each(feature_array, function (feature_array_idx, feature_elem) { feature_elem.setMap(mapa_obj); });
                            });

                            $.each($("#" + data["response"][j]["id_capa"] + "panel_body").children(), function (feature_checkbox_idx, feature_checkbox_div_elem) {
                                var feature_checkbox_input_elem = $(feature_checkbox_div_elem).children()[0];
                                $(feature_checkbox_input_elem).prop("checked", true);
                            });

                            $("#" + data["response"][j]["id_capa"] + "panel").show();
                        }
                        else {
                            for (var k = 0, feature_vector_length = data["response"][j]["feature_vector"].length; k < feature_vector_length; k = k + 1) {
                                $("#" + data["response"][j]["feature_vector"][k]["id_feature_vector"] + "feature_check").prop("checked", true);
                                var el_feature = capas_array[data["response"][j]["id_capa"]][data["response"][j]["feature_vector"][k]["id_feature_vector"]];

                                for (var l = 0, el_feature_length = el_feature.length; l < el_feature_length; l++) {
                                    el_feature[l].setMap(mapa_obj);
                                }
                            }
                        }
                        $("#" + data["response"][j]["id_capa"] + "panel").show(); //EN CASO DE QUE SE CIERRE EL PANEL
                        $("#" + data["response"][j]["id_capa"] + "capa_check").prop("checked", true);

                        continue;
                    }

                    capas_array[data["response"][j]["id_capa"]] = {};

                    if (data["response"][j]["nombre_tipo_capa"] == "Raster") {
                        cargar_feature_raster(data["response"][j]["feature_raster"], mapa_obj, data["response"][j]["id_capa"], data["response"][j]["nombre"], sw_actualizacion);
                    }
                    else {
                        cargar_feature_vector(data["response"][j]["feature_vector"], mapa_obj, data["response"][j]["id_capa"], data["response"][j]["nombre"], data["response"][j]["cargar_kml"], data["response"][j]["url"], false, sw_actualizacion);
                    }

                    if (!capas_array[data["response"][j]["id_capa"]]['kml_carga']) {
                        agregar_panel_seleccion_capa(data["response"][j]["id_capa"], data["response"][j]["nombre"]);
                    }

                    $("#" + data["response"][j]["id_capa"] + "capa_menu_check").prop("checked", true);

                    if (!(data["response"][j]["id_capa"] in id_capas_busqueda_array)) {
                        id_capas_busqueda_array[data["response"][j]["id_capa"]] = {};
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["estatica"] = data["response"][j]["estatica"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["cargar_kml"] = data["response"][j]["cargar_kml"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["tiene_leyenda"] = data["response"][j]["tiene_leyenda"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["url_leyenda"] = data["response"][j]["url_leyenda"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["nombre"] = data["response"][j]["nombre"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"] = "activate";

                        if (data["response"][j]["cargar_kml"]) {
                            id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = "kml";

                            if (!is_mobile) {
                                setTimeout(function () {
                                    legends_set_params({ 'action': id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"], 'value': data["response"][j]["id_capa"] });
                                }, 1000);
                            }
                        }
                        else {
                            if (data["response"][j]["nombre_tipo_capa"] == 'Raster') {
                                id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = data["response"][j]["nombre_tipo_capa"];
                            }
                            else {
                                geometria = $.parseJSON(data["response"][j]["feature_vector"][0].geometry_text);

                                tipo = obtener_tipo_capa_vector(geometria);

                                id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = tipo;
                            }
                            if (!is_mobile) {
                                legends_set_params({ 'action': id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"], 'value': data["response"][j]["id_capa"] });
                            }
                        }
                    }
                }

                if (($("#mapa_info_panel").has("[id$=panel]").length) && (!$("#mapa_info_panel").is(":visible")) && !sw_actualizacion) {
                    $("#collapse_info_panel_span").click();
                }

                if ((nombre_capa != undefined) && (valores_busqueda["nombre_capa"].indexOf(nombre_capa) == -1)) {
                    valores_busqueda["nombre_capa"].push(nombre_capa);
                }
                else if ((valor_alfanumerico != undefined) && (valores_busqueda["nombre_feature"].indexOf(valor_alfanumerico) == -1)) {
                    valores_busqueda["nombre_feature"].push(valor_alfanumerico);
                }
            }
            else {
                if (!sw_actualizacion) {
                    $("#mensaje_error").html(data["message"]);
                    $("#MensajeErrorModal").modal("show");
                }

            }
        },
        error: function (request, status, error) {
            error_response_json = {};
            error_response_json_detail = {};
            error_response_json_detail["status"] = status;
            error_response_json_detail["error"] = error;
            error_response_json["error_detail"] = error_response_json_detail;

            response_data = error_response_json;
            if (!sw_actualizacion) {
                //alert ("No fue posible obtener la informacion de la capa");
                $("#mensaje_error").html("No fue posible obtener la informacion de la capa");
                $("#MensajeErrorModal").modal("show");
            }
        }
    });
}

function visualizar_capa_busqueda2(mapa_obj, nombre_capa, valor_alfanumerico, sw_actualizacion) {
    var jsonCapasBusquedaArray = JSON.stringify(Object.keys(id_capas_busqueda_array));

    $.ajax({
        url: informacion_capa_servicio_busqueda,
        type: "POST",
        dataType: "json",
        data: { "nombre_capa": nombre_capa, "valor_alfanumerico": valor_alfanumerico, "jsonCapasBusquedaArray": jsonCapasBusquedaArray },
        async: true,
        success: function (data) {
            if (data["status"] == "ok") {
                for (var j = 0, response_length = data["response"].length; j < response_length; j++) {
                    if (sw_actualizacion) {
                        eliminar_capa(capas_array[data["response"][j]["id_capa"]], data["response"][j]["id_capa"], false);
                    }

                    if ((data["response"][j]["id_capa"] in id_capas_carga_array)) {
                        if (valor_alfanumerico == '') {	// INDICA QUE LA CAPA FUE CARGADA Y MARCA EL CHECK DE TODOS LOS FEATURES EN EL PANEL**
                            $.each(capas_array[data["response"][j]["id_capa"]], function (id_feature, feature_array) {
                                $.each(feature_array, function (feature_array_idx, feature_elem) { feature_elem.setMap(mapa_obj); });
                            });

                            $.each($("#" + data["response"][j]["id_capa"] + "panel_body").children(), function (feature_checkbox_idx, feature_checkbox_div_elem) {
                                var feature_checkbox_input_elem = $(feature_checkbox_div_elem).children()[0];
                                $(feature_checkbox_input_elem).prop("checked", true);
                            });

                            $("#" + data["response"][j]["id_capa"] + "panel").show();
                        }
                        else {
                            //		                                                        				INDICA QUE LA CAPA FUE CARGADA Y MARCA SOLO EL CHECK DE LOS FEATURES BUSCADOS EN EL PANEL
                            for (var k = 0, feature_vector_length = data["response"][j]["feature_vector"].length; k < feature_vector_length; k = k + 1) {
                                $("#" + data["response"][j]["feature_vector"][k]["id_feature_vector"] + "feature_check").prop("checked", true);
                                var el_feature = capas_array[data["response"][j]["id_capa"]][data["response"][j]["feature_vector"][k]["id_feature_vector"]];

                                for (var l = 0, el_feature_length = el_feature.length; l < el_feature_length; l++) {
                                    el_feature[l].setMap(mapa_obj);
                                }
                            }
                        }
                        $("#" + data["response"][j]["id_capa"] + "panel").show(); //EN CASO DE QUE SE CIERRE EL PANEL
                        $("#" + data["response"][j]["id_capa"] + "capa_check").prop("checked", true);

                        continue;
                    }

                    capas_array[data["response"][j]["id_capa"]] = {};

                    if (data["response"][j]["nombre_tipo_capa"] == "Raster") {
                        cargar_feature_raster(data["response"][j]["feature_raster"], mapa_obj, data["response"][j]["id_capa"], data["response"][j]["nombre"], sw_actualizacion);
                    }
                    else {
                        cargar_feature_vector(data["response"][j]["feature_vector"], mapa_obj, data["response"][j]["id_capa"], data["response"][j]["nombre"], data["response"][j]["cargar_kml"], data["response"][j]["url"], false, sw_actualizacion);
                    }

                    if (!capas_array[data["response"][j]["id_capa"]]['kml_carga']) {
                        agregar_panel_seleccion_capa(data["response"][j]["id_capa"], data["response"][j]["nombre"]);
                    }

                    $("#" + data["response"][j]["id_capa"] + "capa_menu_check").prop("checked", true);

                    if (!(data["response"][j]["id_capa"] in id_capas_busqueda_array)) {
                        id_capas_busqueda_array[data["response"][j]["id_capa"]] = {};
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["estatica"] = data["response"][j]["estatica"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["cargar_kml"] = data["response"][j]["cargar_kml"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["tiene_leyenda"] = data["response"][j]["tiene_leyenda"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["url_leyenda"] = data["response"][j]["url_leyenda"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["nombre"] = data["response"][j]["nombre"];
                        id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"] = "activate";

                        if (data["response"][j]["cargar_kml"]) {
                            id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = "kml";

                            if (!is_mobile) {
                                setTimeout(function () {
                                    legends_set_params({ 'action': id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"], 'value': data["response"][j]["id_capa"] });
                                }, 1000);
                            }
                        }
                        else {
                            if (data["response"][j]["nombre_tipo_capa"] == 'Raster') {
                                id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = data["response"][j]["nombre_tipo_capa"];
                            }
                            else {
                                geometria = $.parseJSON(data["response"][j]["feature_vector"][0].geometry_text);

                                tipo = obtener_tipo_capa_vector(geometria);

                                id_capas_busqueda_array[data["response"][j]["id_capa"]]["tipo_capa"] = tipo;
                            }
                            if (!is_mobile) {
                                legends_set_params({ 'action': id_capas_busqueda_array[data["response"][j]["id_capa"]]["estado_capa"], 'value': data["response"][j]["id_capa"] });
                            }
                        }
                    }
                }

                if (($("#mapa_info_panel").has("[id$=panel]").length) && (!$("#mapa_info_panel").is(":visible")) && !sw_actualizacion) {
                    $("#collapse_info_panel_span").click();
                }

                if ((nombre_capa != undefined) && (valores_busqueda["nombre_capa"].indexOf(nombre_capa) == -1)) {
                    valores_busqueda["nombre_capa"].push(nombre_capa);
                }
                else if ((valor_alfanumerico != undefined) && (valores_busqueda["nombre_feature"].indexOf(valor_alfanumerico) == -1)) {
                    valores_busqueda["nombre_feature"].push(valor_alfanumerico);
                }
            }
            else {
                if (!sw_actualizacion) {
                    //alert (data["mensaje"]);
                    $("#mensaje_error").html(data["message"]);
                    $("#MensajeErrorModal").modal("show");
                }

            }
        },
        error: function (request, status, error) {
            error_response_json = {};
            error_response_json_detail = {};
            error_response_json_detail["status"] = status;
            error_response_json_detail["error"] = error;
            error_response_json["error_detail"] = error_response_json_detail;

            response_data = error_response_json;
            if (!sw_actualizacion) {
                //alert ("No fue posible obtener la informacion de la capa");
                $("#mensaje_error").html("No fue posible obtener la informacion de la capa");
                $("#MensajeErrorModal").modal("show");
            }
        }
    });
}

function mostrar_capa_raster_imagen(id_capa, nombre_capa, mapa_obj, url, extent_norte, extent_sur, extent_este, extent_oeste, alpha, sw_actualizacion) {
    LatLng_capas[id_capa] = [];
    var bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(extent_sur, extent_oeste),
        new google.maps.LatLng(extent_norte, extent_este)
    );


    if (nombre_capa.indexOf("Modelo de elevacion digital") !== -1) {
        var overlay_obj = new google.maps.GroundOverlay(
            url + "?no_cache=" + (Math.round(Math.random() * 1000000000000000000) + 1),
            bounds
        );
        overlay_obj.setOpacity(alpha);
        overlay_obj.setMap(mapa_obj);

        google.maps.event.addListener(overlay_obj, 'click', function (event) { trazar(event.latLng, mapa_obj); /*alert(event.latLng);*/ });
    }
    else {
        if (url.indexOf("AreaMetRadar_10_120_DBZH.png") !== -1) {
            url = "https://siata.gov.co/CalidadAire/Imagen_Radar/Radar.webp"
        }
        overlay_obj = new ProjectedOverlay(mapa_obj, url + "?no_cache=" + (Math.round(Math.random() * 1000000000000000000) + 1), bounds, { percentOpacity: 50 });
        overlay_obj.url_ = url + "?no_cache=" + (Math.round(Math.random() * 1000000000000000000) + 1);
        overlay_obj.percentOpacity_ = alpha * 100;
        overlay_obj.setMap(null);
    }


    if ($("#" + id_capa + "capa_check").length) {
        if ($("#" + id_capa + "capa_check").is(':checked')) {
            overlay_obj.setMap(mapa_obj);
        }
    }
    else {
        overlay_obj.setMap(mapa_obj);
    }

    inicializar_mouseover_raster_callback(overlay_obj, mostrar_valor_capas_raster_callback);

    /* if(nombre_capa.indexOf("Modelo de elevacion digital")!== -1)
     {
         console.log(overlay_obj);
         console.log("hola");
         google.maps.event.addListener(overlay_obj, 'click', function(event) { trazar(event.latLng, mapa_obj); alert(event.latLng);});
     }*/

    LatLng_capas[id_capa].push(bounds.getNorthEast());
    LatLng_capas[id_capa].push(bounds.getSouthWest());

    if (!sw_actualizacion) {
        // ajustar_zoom(mapa_obj);
        ajustar_zoom2(mapa_obj, LatLng_capas[id_capa])
    }
    return overlay_obj;

}

function mostrar_capa_vector(id_capa, mapa_obj, geometry_geojson_obj, icono, cargar_kml, atributos_feature_style, id_feature_vector, nombre_feature, nombre_capa) {
    if (geometry_geojson_obj["type"].toUpperCase() == "MULTIPOLYGON") {
        return mostrar_capa_multipolygon(id_capa, mapa_obj, geometry_geojson_obj, id_feature_vector, atributos_feature_style);
    }
    else if (geometry_geojson_obj["type"].toUpperCase() == "POLYGON") {
        return mostrar_capa_polygon(id_capa, mapa_obj, geometry_geojson_obj, id_feature_vector, atributos_feature_style);
    }
    else if (geometry_geojson_obj["type"].toUpperCase() == "POINT") {
        return mostrar_capa_point(id_capa, mapa_obj, geometry_geojson_obj, icono, id_feature_vector, nombre_feature, nombre_capa);
    }
    else if (geometry_geojson_obj["type"].toUpperCase() == "MULTILINESTRING") {
        return mostrar_capa_multiline(id_capa, mapa_obj, geometry_geojson_obj, atributos_feature_style, id_feature_vector);
    }
    else if (geometry_geojson_obj["type"].toUpperCase() == "LINESTRING") {
        return mostrar_capa_line(id_capa, mapa_obj, geometry_geojson_obj, atributos_feature_style, id_feature_vector);
    }
}

function mostrar_capa_point(id_capa, mapa_obj, geometry_geojson_obj, icono, id_feature_vector, nombre_feature, nombre_capa) {
    var geometry_coordinates = geometry_geojson_obj["coordinates"];
    var response_point_array = [];

    var url = (icono != "") ? icono : "https://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png" + "?no_cache=" + (Math.round(Math.random() * 1000000000000000000) + 1);
    url = url.replace("http://www.", "https://");
    url = url.replace("http://", "https://");

    tamano = new google.maps.Size(32, 32);
    tamano_escalado = new google.maps.Size(32, 32);
    origen = new google.maps.Point(0, 0);

    if (nombre_capa == "MeteorolÃ³gica") {
        tamano = new google.maps.Size(125, 125);
        tamano_escalado = new google.maps.Size(80, 80);
        origen = new google.maps.Point(0, 0);
        anchor = new google.maps.Point(45, 45)

        var icon_image = {
            url: url,
            scaledSize: tamano_escalado,
            origin: origen,
            anchor: anchor
        };
    }
    else if (id_capa == "C_00000000000000000001030" || id_capa == "C_00000000000000000001031" || id_capa == "C_00000000000000000001032") {
        url = "https://siata.gov.co/kml/incendios_modis/punto_rojo.png";
        tamano = new google.maps.Size(8, 8);
        tamano_escalado = new google.maps.Size(8, 8);

        var icon_image = {
            url: url,
            size: tamano,
            scaledSize: tamano_escalado,
            origin: origen
        };
    }
    else if (id_capa == "C_00000000000000000001132" || id_capa == "C_00000000000000000001133" || id_capa == "C_00000000000000000001134") {
        url = "https://siata.gov.co/kml/incendios_modis/Yellow_icon.png";
        tamano = new google.maps.Size(8, 8);
        tamano_escalado = new google.maps.Size(8, 8);

        var icon_image = {
            url: url,
            size: tamano,
            scaledSize: tamano_escalado,
            origin: origen
        };
    }
    else {
        var icon_image = {
            url: url,
            size: tamano,
            scaledSize: tamano_escalado,
            origin: origen
        };
    }

    if (nombre_feature == null) {
        var marker_obj = new google.maps.Marker({
            position: new google.maps.LatLng(geometry_coordinates[1], geometry_coordinates[0]),
            icon: icon_image,
            optimized: false
        });
    }
    else {
        var marker_obj = new google.maps.Marker({
            position: new google.maps.LatLng(geometry_coordinates[1], geometry_coordinates[0]),
            icon: icon_image,
            title: nombre_feature,
            optimized: false
        });
    }

    if ($("#" + id_feature_vector + "feature_check").length) {
        if ($("#" + id_feature_vector + "feature_check").is(':checked')) {
            marker_obj.setMap(mapa_obj);
        }
        else {
            marker_obj.setMap(null);
        }
    }
    else {
        marker_obj.setMap(mapa_obj);
    }

    LatLng_capas[id_capa].push(marker_obj.position);
    inicializar_mouseover_raster_callback(marker_obj, mostrar_valor_capas_raster_callback);
    response_point_array.push(marker_obj);
    return response_point_array;
}

function obtener_tipo_capa_vector(geometry_geojson_obj) {
    return geometry_geojson_obj["type"].toUpperCase();
}

function mostrar_capa_multipolygon(id_capa, mapa_obj, geometry_geojson_obj, id_feature_vector, atributos_feature_style) {
    var geometry_coordinates = geometry_geojson_obj["coordinates"];
    var response_poly_array = [];

    // Cada "poly"

    for (var i = 0; i < geometry_coordinates.length; i++) {
        var current_poly_defn = geometry_coordinates[i];

        ext_latlng_array = []

        // Cada "exterior"
        var exterior_coord_array = current_poly_defn[0];

        for (var pi = 0; pi < exterior_coord_array.length; pi++) {
            ext_latlng_array.push(new google.maps.LatLng(exterior_coord_array[pi][1], exterior_coord_array[pi][0]));
        }

        LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(ext_latlng_array);
        var paths_obj = [ext_latlng_array];

        // Cada "interior"
        if (current_poly_defn.length > 1) {
            for (var j = 1; j < current_poly_defn.length; j++) {
                var interior_coord_array = current_poly_defn[j];
                var current_int_latlng_array = [];

                for (var pi = 0; pi < interior_coord_array.length; pi++) {
                    current_int_latlng_array.push(new google.maps.LatLng(interior_coord_array[pi][1], interior_coord_array[pi][0]));
                }

                paths_obj.push(current_int_latlng_array);
            }
            LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(current_int_latlng_array);
        }

        // Crea cada poly en el mapa //


        var strokeColor = '#000000';
        var strokeOpacity = 1.0;
        var strokeWeight = 1.5;
        var fillColor = '#FFFFFF';
        var fillOpacity = 0.30;

        if (id_capa == "C_00000000000000000000666") {
            fillOpacity = 0.60;
        }
        else if (id_capa == "C_00000000000000000000399") {
            fillOpacity = 0;
        }

        if (atributos_feature_style) {
            strokeColor = atributos_feature_style.color_linea.valor_alfanumerico;
            fillColor = atributos_feature_style.color_poligono.valor_alfanumerico;
            strokeWeight = atributos_feature_style.grosor_linea.valor_alfanumerico;
        }

        var current_poly_obj = new google.maps.Polygon({
            paths: paths_obj,
            strokeColor: strokeColor,
            strokeOpacity: strokeOpacity,
            strokeWeight: strokeWeight,
            fillColor: fillColor,
            fillOpacity: fillOpacity
        });

        if ($("#" + id_feature_vector + "feature_check").length) {
            if ($("#" + id_feature_vector + "feature_check").is(':checked')) {
                current_poly_obj.setMap(mapa_obj);
            }
        }
        else {
            current_poly_obj.setMap(mapa_obj);
        }

        inicializar_mouseover_raster_callback(current_poly_obj, mostrar_valor_capas_raster_callback);
        response_poly_array.push(current_poly_obj);
    }

    return response_poly_array;
}

function mostrar_capa_polygon(id_capa, mapa_obj, geometry_geojson_obj, id_feature_vector, atributos_feature_style) {
    var geometry_coordinates = geometry_geojson_obj["coordinates"];
    var ext_latlng_array = [];
    var response_poly_array = [];
    var current_poly_defn = geometry_coordinates;

    // Cada "exterior"
    var exterior_coord_array = current_poly_defn[0];

    for (var pi = 0; pi < exterior_coord_array.length; pi++) {
        ext_latlng_array.push(new google.maps.LatLng(exterior_coord_array[pi][1], exterior_coord_array[pi][0]));
    }

    LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(ext_latlng_array);
    var paths_obj = [ext_latlng_array];

    // Cada "interior" .
    if (current_poly_defn.length > 1) {
        for (var j = 1; j < current_poly_defn.length; j++) {
            var interior_coord_array = current_poly_defn[j];
            var current_int_latlng_array = [];

            for (var pi = 0; pi < interior_coord_array.length; pi++) {
                current_int_latlng_array.push(new google.maps.LatLng(interior_coord_array[pi][1], interior_coord_array[pi][0]));
            }

            paths_obj.push(current_int_latlng_array);
        }

        LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(current_int_latlng_array);
    }

    // Crea cada poly en el mapa //
    var strokeColor = '#000000';
    var strokeOpacity = 1.0;
    var strokeWeight = 3;
    var fillColor = '#FFFFFF';

    if (atributos_feature_style) {
        strokeColor = atributos_feature_style.color_linea.valor_alfanumerico;
        fillColor = atributos_feature_style.color_poligono.valor_alfanumerico;
        strokeWeight = atributos_feature_style.grosor_linea.valor_alfanumerico;
    }

    var current_poly_obj = new google.maps.Polygon({
        paths: paths_obj,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWeight: strokeWeight,
        fillColor: fillColor,
        fillOpacity: 0.35
    });

    if ($("#" + id_feature_vector + "feature_check").length) {
        if ($("#" + id_feature_vector + "feature_check").is(':checked')) {
            current_poly_obj.setMap(mapa_obj);
        }
    }
    else {
        current_poly_obj.setMap(mapa_obj);
    }

    inicializar_mouseover_raster_callback(current_poly_obj, mostrar_valor_capas_raster_callback);
    response_poly_array.push(current_poly_obj);

    return response_poly_array;
}

function mostrar_capa_multiline(id_capa, mapa_obj, geometry_geojson_obj, atributos_feature_style, id_feature_vector) {
    var geometry_coordinates = geometry_geojson_obj["coordinates"];
    var ext_latlng_array = [];
    var response_line_array = [];

    var current_line_defn = geometry_coordinates[0];

    for (var pi = 0; pi < current_line_defn.length; pi++) {
        ext_latlng_array.push(new google.maps.LatLng(current_line_defn[pi][1], current_line_defn[pi][0]));
    }

    LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(ext_latlng_array);

    var strokeColor = '#FF0000';
    var strokeOpacity = 1.0;
    var strokeWeight = 3;

    if (atributos_feature_style) {
        strokeColor = atributos_feature_style.color_linea.valor_alfanumerico;
        strokeWeight = atributos_feature_style.grosor_linea.valor_alfanumerico;

    }

    var current_line_obj = new google.maps.Polyline({
        path: ext_latlng_array,
        geodesic: true,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWeight: strokeWeight
    });

    if ($("#" + id_feature_vector + "feature_check").length) {
        if ($("#" + id_feature_vector + "feature_check").is(':checked')) {
            current_line_obj.setMap(mapa_obj);
        }
    }
    else {
        current_line_obj.setMap(mapa_obj);
    }

    inicializar_mouseover_raster_callback(current_line_obj, mostrar_valor_capas_raster_callback);
    response_line_array.push(current_line_obj);

    return response_line_array;
}

function mostrar_capa_line(id_capa, mapa_obj, geometry_geojson_obj, atributos_feature_style, id_feature_vector) {
    var geometry_coordinates = geometry_geojson_obj["coordinates"];
    var ext_latlng_array = [];
    var response_line_array = [];

    var current_line_defn = geometry_coordinates;

    for (var pi = 0; pi < current_line_defn.length; pi++) {
        ext_latlng_array.push(new google.maps.LatLng(current_line_defn[pi][1], current_line_defn[pi][0]));
    }

    LatLng_capas[id_capa] = LatLng_capas[id_capa].concat(ext_latlng_array);

    var strokeColor = '#FF0000';
    var strokeOpacity = 1.0;
    var strokeWeight = 3;

    if (atributos_feature_style) {
        strokeColor = atributos_feature_style.color_linea.valor_alfanumerico;
        strokeWeight = atributos_feature_style.grosor_linea.valor_alfanumerico;
    }

    var current_line_obj = new google.maps.Polyline({
        path: ext_latlng_array,
        geodesic: true,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWeight: strokeWeight
    });

    if ($("#" + id_feature_vector + "feature_check").length) {
        if ($("#" + id_feature_vector + "feature_check").is(':checked')) {
            current_line_obj.setMap(mapa_obj);
        }
    }
    else {
        current_line_obj.setMap(mapa_obj);
    }

    inicializar_mouseover_raster_callback(current_line_obj, mostrar_valor_capas_raster_callback);
    response_line_array.push(current_line_obj);

    return response_line_array;
}

function geolocate(mapa_obj) {
    GMaps.geolocate({
        success: function (position) {
            mapa_obj.removeMarkers();
            mapa_obj.setCenter(position.coords.latitude, position.coords.longitude);
            mapa_obj.setZoom(16);
        },
        error: function (error) {
            alertError("geolocate_error");
        },
        not_supported: function () {
            alertError("geolocate_not_supported");
        }
    });
}

function cargar_feature_raster(feature_raster_array, mapa_obj, id_capa, nombre_capa, sw_actualizacion) {
    capas_raster_array[id_capa] = new Array();

    for (var i = 0, feature_raster_length = feature_raster_array.length; i < feature_raster_length; i++) {
        var capa_raster_imagen = mostrar_capa_raster_imagen(id_capa,
            nombre_capa,
            mapa_obj,
            feature_raster_array[i]["url"],
            parseFloat(feature_raster_array[i]["extent"]["norte"]),
            parseFloat(feature_raster_array[i]["extent"]["sur"]),
            parseFloat(feature_raster_array[i]["extent"]["este"]),
            parseFloat(feature_raster_array[i]["extent"]["oeste"]),
            parseFloat(feature_raster_array[i]["alpha"]),
            sw_actualizacion);

        capas_array[id_capa][feature_raster_array[i]["id_feature_raster"]] = new Array();
        capas_array[id_capa][feature_raster_array[i]["id_feature_raster"]].push(capa_raster_imagen);
        capas_raster_array[id_capa].push(feature_raster_array[i]["id_feature_raster"]);

        var capas_raster_panel = ["C_00000000000000000000719", "C_00000000000000000000718", "C_00000000000000000000717", "C_00000000000000000000716", "C_00000000000000000000715", "C_00000000000000000001105", "C_00000000000000000001106"];
        var index = capas_raster_panel.indexOf(id_capa);

        if (index != -1 && !($("#" + feature_raster_array[i]["id_feature_raster"] + "info_panel_body").length > 0)) {
            crear_panel_detalle_feature_vector("capas_informacion", feature_raster_array[i]["id_feature_raster"], nombre_capa, id_capa, true);
            cargar_contenido_panel_detalle_raster(feature_raster_array[i]["id_feature_raster"] + "info_panel_body", feature_raster_array[i]["id_feature_raster"], nombre_capa, id_capa, nombre_capa);
        }

    }
}

function cargar_feature_vector(feature_vector_array, mapa_obj, id_capa, nombre_capa, cargar_kml, url_capa, es_trazado, sw_actualizacion) {
    if (cargar_kml) {
        capas_array[id_capa] = new geoXML3.parser({
            map: mapa_obj,
            suppressInfoWindows: true,
            afterParse: configureLayer,
            "id_capa": id_capa,
            "nombre_capa": nombre_capa,
            "es_trazado": es_trazado
        });

        capas_array[id_capa]['kml_carga'] = true;
        capas_array[id_capa].parse(url_capa + "?key=000000000002");
    }
    else {
        capas_vector_array[id_capa] = new Array();
        LatLng_capas[id_capa] = [];

        for (var i = 0, feature_vector_length = feature_vector_array.length; i < feature_vector_length; i++) {
            capas_array[id_capa][feature_vector_array[i]["id_feature_vector"]] = new Array();
            var id_feature = feature_vector_array[i]["id_feature_vector"];

            var geometry_obj = $.parseJSON(feature_vector_array[i]["geometry_text"]);

            var icono = ((feature_vector_array[i]["atributos"]["metadato"]["icon"] != null) && (feature_vector_array[i]["atributos"]["metadato"]["icon"] != undefined)) ? feature_vector_array[i]["atributos"]["metadato"]["icon"]["valor_alfanumerico"] : "";
            //icono = icono.replace("http:","https:");
            icono = icono.replace("http://www.", "https://");
            icono = icono.replace("http://", "https://");
            //console.log(icono);

            if (feature_vector_array[i]["atributos"]["metadato"].hasOwnProperty("name")) {
                var name = feature_vector_array[i]["atributos"]["metadato"]["name"]["valor_alfanumerico"];

                if (name != null && name != undefined) {
                    var nombre_feature = name;
                }
            }
            else if (feature_vector_array[i]["atributos"]["metadato"].hasOwnProperty("nombre")) {
                var nombre = feature_vector_array[i]["atributos"]["metadato"]["nombre"]["valor_alfanumerico"];
                if (nombre != null && nombre != undefined) {
                    var nombre_feature = nombre;
                }
            }
            else {
                var nombre_feature = null;
            }

            if ((feature_vector_array[i]["atributos"]["feature_style"] != null) && (feature_vector_array[i]["atributos"]["feature_style"] != undefined)) {
                var capa_vector = mostrar_capa_vector(id_capa, mapa_obj, geometry_obj, icono, cargar_kml, feature_vector_array[i]["atributos"]["feature_style"], id_feature, nombre_feature, nombre_capa);
            }
            else {
                var capa_vector = mostrar_capa_vector(id_capa, mapa_obj, geometry_obj, icono, cargar_kml, false, id_feature, nombre_feature, nombre_capa);
            }

            capa_vector.atributos_obj = feature_vector_array[i]["atributos"];

            $.each(capa_vector, function (idx_array, capa_vector_obj) {
                capa_vector_obj.atributos_obj = feature_vector_array[i]["atributos"];
                capa_vector_obj.id_feature_vector = feature_vector_array[i]["id_feature_vector"];
                capa_vector_obj.id_capa = id_capa;
                capa_vector_obj.nombre_capa = nombre_capa;

                var nombre_feature = nombre_capa + " " + "(" + (i + 1) + ")";

                if ((feature_vector_array[i]["atributos"]["metadato"]["name"] != null) && (feature_vector_array[i]["atributos"]["metadato"]["name"] != undefined)) {
                    nombre_feature = feature_vector_array[i]["atributos"]["metadato"]["name"]["valor_alfanumerico"];
                }
                else if ((feature_vector_array[i]["atributos"]["metadato"]["nombre"] != null) && (feature_vector_array[i]["atributos"]["metadato"]["nombre"] != undefined)) {
                    nombre_feature = feature_vector_array[i]["atributos"]["metadato"]["nombre"]["valor_alfanumerico"];
                }

                capa_vector_obj.nombre_feature = nombre_feature;
                //inicializar_mouseover_raster_callback (capa_vector_obj, mostrar_valor_capas_raster_callback);
                inicializar_click_vector_callback(capa_vector_obj, mostrar_informacion_capa_callback, mapa_obj);

            });

            capas_array[id_capa][feature_vector_array[i]["id_feature_vector"]] = capa_vector;
            capas_vector_array[id_capa].push(feature_vector_array[i]["id_feature_vector"]);
        }
    }

    if (!sw_actualizacion) {
        //ajustar_zoom(mapa_obj);
        ajustar_zoom2(mapa_obj, LatLng_capas[id_capa])
    }
}

function adicionarEventoClickKML(placemark_obj, id_feature_simulado) {
    if (placemark_obj.marker) {
        placemark_obj.marker.addListener('click', function (event) {

            if (placemark_obj.name != ' ' || placemark_obj.description != '') {
                crear_panel_detalle_feature_vector("capas_informacion", id_feature_simulado, placemark_obj.name, "", true);
                cargar_contenido_panel_detalle_feature_vector_description_kml(id_feature_simulado + "info_panel_body", placemark_obj.description, id_feature_simulado);

                if (!$("#capas_informacion_li").is(".active")) {
                    toggle_panel_class("capas_detalle_li", "active");
                    toggle_panel_class("capas_detalle", "active");
                    toggle_panel_class("capas_informacion_li", "active");
                    toggle_panel_class("capas_informacion", "active");
                }
            }
        });
    }
    if (placemark_obj.polygon) {
        placemark_obj.polygon.addListener('click', function (event) {

            if (placemark_obj.name != ' ' || placemark_obj.description != '') {
                crear_panel_detalle_feature_vector("capas_informacion", id_feature_simulado, placemark_obj.name, "", true);
                cargar_contenido_panel_detalle_feature_vector_description_kml(id_feature_simulado + "info_panel_body", placemark_obj.description, id_feature_simulado);

                if (!$("#capas_informacion_li").is(".active")) {
                    toggle_panel_class("capas_detalle_li", "active");
                    toggle_panel_class("capas_detalle", "active");
                    toggle_panel_class("capas_informacion_li", "active");
                    toggle_panel_class("capas_informacion", "active");
                }
            }
        });
    }
    if (placemark_obj.polyline) {
        placemark_obj.polyline.addListener('click', function (event) {

            if (placemark_obj.name != ' ' || placemark_obj.description != '') {
                crear_panel_detalle_feature_vector("capas_informacion", id_feature_simulado, placemark_obj.name, "", true);
                cargar_contenido_panel_detalle_feature_vector_description_kml(id_feature_simulado + "info_panel_body", placemark_obj.description, id_feature_simulado);

                if (!$("#capas_informacion_li").is(".active")) {
                    toggle_panel_class("capas_detalle_li", "active");
                    toggle_panel_class("capas_detalle", "active");
                    toggle_panel_class("capas_informacion_li", "active");
                    toggle_panel_class("capas_informacion", "active");
                }
            }
        });
    }
}

function configureLayer(docs) {
    if (docs[0].placemarks) {
        if (!this["es_trazado"]) {
            for (var i = 0; i < docs[0].placemarks.length; i++) {
                adicionarEventoClickKML(docs[0].placemarks[i], this["id_capa"] + i);
            }
        }
        agregar_panel_seleccion_capa_kml(this["id_capa"], this["nombre_capa"], docs[0].placemarks, mapa_obj.map);
    }
}

function inicializar_click_vector_callback(target_obj, f_callback, mapa_obj) {
    google.maps.event.addListener(target_obj, 'click', function (event) { f_callback(event, target_obj, mapa_obj); });
}

function mostrar_informacion_capa_callback(event, target_obj, mapa_obj) {
    eliminar_panel_detalle_feature_vector(target_obj.id_feature_vector);

    if (!$("#capas_informacion_li").is(".active")) {
        toggle_panel_class("capas_detalle_li", "active");
        toggle_panel_class("capas_detalle", "active");
        toggle_panel_class("capas_informacion_li", "active");
        toggle_panel_class("capas_informacion", "active");
    }

    if (Object.keys(target_obj.atributos_obj).length > 1) {
        crear_panel_detalle_feature_vector("capas_informacion", target_obj.id_feature_vector, target_obj.nombre_feature, target_obj.id_capa, true);
        cargar_contenido_panel_detalle_feature_vector_humedad(target_obj.id_feature_vector + "info_panel_body", target_obj.id_feature_vector, target_obj.nombre_feature, target_obj.id_capa, target_obj.nombre_capa);
    }
    else {
        crear_panel_detalle_feature_vector("capas_informacion", target_obj.id_feature_vector, target_obj.nombre_feature, target_obj.id_capa, true);
        cargar_contenido_panel_detalle_feature_vector_description(target_obj.id_feature_vector + "info_panel_body", target_obj.id_feature_vector, target_obj.nombre_feature, target_obj.id_capa);
    }

    if (target_obj.id_capa == "C_00000000000000000000211") {
        var codigoEstacion = target_obj.atributos_obj.descripcion.Codigo.valor_alfanumerico;
        var idCapaCuencaAsociada = cuencasAsociadasNiveljson[codigoEstacion];


        if (typeof idCapaCuencaAsociada != "undefined") {
            visualizar_capa(mapa_obj, idCapaCuencaAsociada, true, true, false, true);
        }
    }
}

function actualizar_capas_cargadas(mapa_obj, sw_actualizar) {
    $.each(id_capas_carga_array, function (id_capa, parametros_capa_array) {
        var capa_cargada = id_capa in capas_array;
        var capa_cargada_check = $("#" + id_capa + "capa_check").prop("checked");

        if ((capa_cargada && capa_cargada_check && !(parametros_capa_array["estatica"]))) {
            visualizar_capa(mapa_obj.map, id_capa, true, true, sw_actualizar, false);
        }
    });

    $.each(valores_busqueda["nombre_capa"], function (nombre_idx, nombre) {
        visualizar_capa_busqueda(mapa_obj.map, nombre, undefined, sw_actualizar);
    });

    $.each(valores_busqueda["nombre_feature"], function (valor_idx, valor) {
        visualizar_capa_busqueda(mapa_obj.map, undefined, valor, sw_actualizar);
    });
}

function guardar_preferencias(mapa_obj, id_grupo_capas_array) {
    preferenciasDeUsuario = {};
    preferenciasDeUsuario.zoom = mapa_obj.getZoom();
    preferenciasDeUsuario.latitude = mapa_obj.getCenter().lat();
    preferenciasDeUsuario.longitude = mapa_obj.getCenter().lng();
    preferenciasDeUsuario.id_capas_busqueda_array = JSON.stringify(id_capas_busqueda_array);
    preferenciasDeUsuario.id_capas_carga_array = JSON.stringify(id_capas_carga_array);
    preferenciasDeUsuario.id_grupo_capas_array = JSON.stringify(id_grupo_capas_array);
    preferenciasDeUsuario.valores_busqueda = JSON.stringify(valores_busqueda);

    if (!is_mobile) {
        nombre_widget_array = [];
        $('#menu_widgets').find('input:checkbox:checked').each(function () {
            nombre_widget_array.push($(this).attr("name"));
        });



        if (nombre_widget_array.indexOf('control_zoom')) {
            preferenciasDeUsuario.tipoZoom = $('input[name=zoom]:checked').val();
        }

        preferenciasDeUsuario.nombre_widget_array = JSON.stringify(nombre_widget_array);
    }



    preferenciasDeUsuario_json = JSON.stringify(preferenciasDeUsuario);

    $.ajaxSetup({ async: false });

    $.post(guardar_preferencias_servicio,
        {
            'SIATA_preferenciasDeUsuario': preferenciasDeUsuario_json
        },
        function (data) {
            if (data.error) {
                localStorage.setItem("SIATA_preferenciasDeUsuario", preferenciasDeUsuario_json);
            }
        },
        'json');

    $.ajaxSetup({ async: true });

    if (timer_preferencias == null) {
        timer_preferencias = setInterval(guardar_preferencias_de_usuario, 60000);
    }
}

function borrar_preferencias() {
    $.ajaxSetup({ async: false });
    $.post(borrar_preferencias_servicio, {}, function (data) { if (data.error) { localStorage.removeItem('SIATA_preferenciasDeUsuario'); } }, 'json');
    $.ajaxSetup({ async: true });
    clearInterval(timer_preferencias);
    timer_preferencias = null;
}

function cargarPreferencias(mapa_obj) {
    $.ajaxSetup({ async: false });
    $.post(cargar_preferencias_servicio, {}, function (data) {
        if (data.error) {
            preferenciasDeUsuario = localStorage.getItem('SIATA_preferenciasDeUsuario');
        }
        else {
            preferenciasDeUsuario = data.preferencias;
        }
    }, 'json');

    if (preferenciasDeUsuario != null && preferenciasDeUsuario != undefined && preferenciasDeUsuario != '') {
        preferenciasDeUsuario = jQuery.parseJSON(preferenciasDeUsuario);
        id_capas_busqueda_array = jQuery.parseJSON(preferenciasDeUsuario.id_capas_busqueda_array);
        id_capas_carga_array = jQuery.parseJSON(preferenciasDeUsuario.id_capas_carga_array);
        valores_busqueda = jQuery.parseJSON(preferenciasDeUsuario.valores_busqueda);

        var array_restricciones;
        $.post(consultar_restricciones_servicio,
            {},
            function (data) {
                array_restricciones = data;
            },
            'json');



        $.each(valores_busqueda["nombre_capa"], function (nombre_idx, nombre) {
            visualizar_capa_busqueda(mapa_obj.map, nombre, undefined, false);
        });

        $.each(valores_busqueda["nombre_feature"], function (valor_idx, valor) {
            visualizar_capa_busqueda(mapa_obj.map, undefined, valor, false);
        });

        if (!is_mobile) {
            $("input:checkbox[id*='widget_check']").each(function (index, e) {
                var $this = $(this);
                if ($this.is(":checked")) {
                    var g = $this.attr("id");
                    $("#" + g).click();
                }
            });

            nombre_widget_activos = jQuery.parseJSON(preferenciasDeUsuario.nombre_widget_array);
            nombre_widget_array = [];
            $.each(nombre_widget_activos, function (nombre_widget_idx, nombre_widget) {

                if (!$("#" + nombre_widget + "widget_check").is(":checked")) {
                    $("#" + nombre_widget + "widget_check").click();
                }
            });

            if (nombre_widget_activos.indexOf('control_zoom') >= 0) {
                tipoZoom = preferenciasDeUsuario.tipoZoom;
                $("input[name=zoom][value='" + tipoZoom + "']").prop("checked", true);
            }
        }
        var id_capa_aux;

        $.each(id_capas_carga_array, function (id_capa, parametros_capa_array) {
            var capa_cargada = id_capa in capas_array;
            var posee_restricciones = jQuery.inArray(id_capa, array_restricciones) > 0;

            if ((!capa_cargada || (capa_cargada && !(parametros_capa_array["estatica"]))) && !posee_restricciones) {

                visualizar_capa(mapa_obj.map, id_capa, true, true, false, false);
                id_capa_aux = id_capa;
            }
        });
        legends_set_params({ 'action': 'activate', 'value': id_capa_aux });
        timer_preferencias = setInterval(guardar_preferencias_de_usuario, 60000);
        $("#preferencias_check").prop("checked", true);
    }
    else {
        capas_defecto();
        $.each(nombre_widget_array, function (nombre_idx, nombre) {
            if (nombre == "animacion_radar" || nombre == "animacion_wrf" || nombre == "animacion_goes") //|| nombre ==  "animacion_humedad" || nombre ==  "animacion_Qsim")
            {
                $("#" + nombre + "widget_check_principal").prop("checked", true);
            }
            $("#" + nombre + "widget_check").prop("checked", true);
        });
    }

    $.ajaxSetup({ async: true });
}

function guardar_peticiones(id_capa) {
    $.ajax({
        url: guardar_peticiones_servicio,
        async: false,
        dataType: "json",
        type: "POST",
        data:
        {
            "id_capa": id_capa,
            "latitud": latitud,
            "longitud": longitud
        },
        success: function (response) {
            if (response.error) { }
            else { }
        }
    });
}
function fn_ok(respuesta) {

    latitud = respuesta.coords.latitude;
    longitud = respuesta.coords.longitude;
}

function fn_error(respuesta) {

    latitud = "-999";
    longitud = "-999";
}

function ajustar_zoom(mapa_obj) {
    var tipo_zoom = $('input[name="zoom"]:checked').val();
    if (tipo_zoom == "dinamico") {
        var bounds = new google.maps.LatLngBounds();
        var div_ancho = $("#mapa_div").width();

        $.each(LatLng_capas, function (id_capa, LatLng_array) {
            $.each(LatLng_array, function (idx_latLng, LatLng_elem) {
                bounds.extend(LatLng_elem);
            });
        });
        mapa_obj.fitBounds(bounds);
        mapa_obj.panBy(div_ancho / 5, 0);
    }
}

function ajustar_zoom2(mapa_obj, LatLng_capa) {
    var tipo_zoom = $('input[name="zoom"]:checked').val();
    if (tipo_zoom == "dinamico") {
        var bounds = new google.maps.LatLngBounds();
        var div_ancho = $("#mapa_div").width();

        $.each(LatLng_capa, function (idx_latLng, LatLng_elem) {
            bounds.extend(LatLng_elem);
        });
        mapa_obj.fitBounds(bounds);
        mapa_obj.panBy(div_ancho / 5, 0);

        var zoom = mapa_obj.getZoom();
        mapa_obj.setZoom(zoom - 1);
    }
}

function visualizar_capa_trazador(mapa_obj, id_capa, nombre, url, sw_visualizar) {
    if (sw_visualizar) {
        capas_array[id_capa] = {};
        cargar_feature_vector(null, mapa_obj, id_capa, nombre, true, url, true, true);

        if (($("#mapa_info_panel").has("[id$=panel]").length) && !($("#mapa_info_panel").is(":visible"))) {
            $("#collapse_info_panel_span").click();
        }
    }
    else {
        eliminar_capa(capas_array[id_capa], id_capa, false);

        if (!($("#mapa_info_panel").has("[id$=panel]").length) && ($("#mapa_info_panel").is(":visible"))) {
            $("#collapse_info_panel_span").click();
            mapa_obj.setCenter(new google.maps.LatLng(6.250, -75.568));
            mapa_obj.setZoom(12);
        }
    }
}

function toggle_visibilidad_widget(nombre, id_widget, es_widget_animacion) {
    var chk_flag = $("#" + id_widget).is(':checked');

    if (chk_flag) {
        if (es_widget_animacion) {
            var pars = {};
            pars["capas_raster_activas"] = capas_raster_array;
            if (nombre == "animacion_goes") {
                pars["animationIndex"] = 1;
            }
            else if (nombre == "animacion_wrf") {
                pars["animationIndex"] = 2;
            }
            else if (nombre == "composicion_radar-goes") {
                pars["animationIndex"] = 3;
            }
            else if (nombre == "animacion_radar") {
                pars["animationIndex"] = 0;
            }
            else if (nombre == "animacion_humedad") {
                pars["animationIndex"] = 4;
            }
            else if (nombre == "animacion_Qsim") {
                pars["animationIndex"] = 5;
            }
            else if (nombre == "vulnerabilidad_actual") {
                pars["animationIndex"] = 6;
            }

            console.log(pars["animationIndex"]);

            $('#widget-animacion_radar-container').show();
            animacion_radar_set_params(pars);

            $("#animacion_wrfwidget_check").prop("checked", false);
            $("#composicion_radar-goeswidget_check").prop("checked", false);
            $("#animacion_radarwidget_check").prop("checked", false);
            $("#animacion_goeswidget_check").prop("checked", false);
            $("#animacion_humedadwidget_check").prop("checked", false);
            $("#animacion_Qsimwidget_check").prop("checked", false);
            $("#vulnerabilidad_actualwidget_check").prop("checked", false);
            $("#animacion_radarwidget_check_principal").prop("checked", false);
            $("#animacion_wrfwidget_check_principal").prop("checked", false);
            $("#animacion_goeswidget_check_principal").prop("checked", false);
            console.log("false");

            if (nombre == "animacion_radar" || nombre == "animacion_wrf" || nombre == "animacion_goes") //|| nombre ==  "animacion_humedad" || nombre ==  "animacion_Qsim")
            {
                $("#" + nombre + "widget_check_principal").prop("checked", true);
                console.log("true");
            }
            $("#" + nombre + "widget_check").prop("checked", true);

            var index_radar = nombre_widget_array.indexOf("animacion_radar");
            var index_radar_goes = nombre_widget_array.indexOf("composicion_radar-goes");
            var index_goes = nombre_widget_array.indexOf("animacion_goes");
            var index_wrf = nombre_widget_array.indexOf("animacion_wrf");
            var index_humedad = nombre_widget_array.indexOf("animacion_humedad");
            var index_Qsim = nombre_widget_array.indexOf("animacion_Qsim");
            var index_Vulnerabilidad = nombre_widget_array.indexOf("vulnerabilidad_actual");

            if (index_radar > -1) nombre_widget_array.splice(index_radar, 1);
            if (index_radar_goes > -1) nombre_widget_array.splice(index_radar_goes, 1);
            if (index_goes > -1) nombre_widget_array.splice(index_goes, 1);
            if (index_wrf > -1) nombre_widget_array.splice(index_wrf, 1);
            if (index_humedad > -1) nombre_widget_array.splice(index_humedad, 1);
            if (index_Qsim > -1) nombre_widget_array.splice(index_Qsim, 1);
            if (index_Vulnerabilidad > -1) nombre_widget_array.splice(index_Vulnerabilidad, 1);
        }
        else {
            $('#widget-' + nombre + '-container').show();
            $("#" + nombre + "widget_check").prop("checked", true);
        }

        nombre_widget_array.push(nombre);
    }
    else {
        if (nombre == "animacion_goes" || nombre == "animacion_wrf" || nombre == "composicion_radar-goes" || nombre == "animacion_humedad" || nombre == "animacion_Qsim" || nombre == "vulnerabilidad_actual") {
            $('#widget-animacion_radar-container').hide();
        }
        else {
            $('#widget-' + nombre + '-container').hide();
        }
        detener_animacion();

        if (nombre == "animacion_radar" || nombre == "animacion_wrf" || nombre == "animacion_goes" || nombre == "animacion_humedad" || nombre == "animacion_Qsim") {
            $("#" + nombre + "widget_check_principal").prop("checked", false);
        }
        $("#" + nombre + "widget_check").prop("checked", false);

        var index_nombre_widget = nombre_widget_array.indexOf(nombre);

        if (index_nombre_widget > -1) {
            nombre_widget_array.splice(index_nombre_widget, 1);
        }
    }
}

function es_capa_aire(id_capa) {
    var id_capas_aire = ["C_00000000000000000000602", "C_00000000000000000000603", "C_00000000000000000000759", "C_00000000000000000000745",
        "C_00000000000000000000760", "C_00000000000000000000747", "C_00000000000000000000746", "C_00000000000000000000748", "C_00000000000000000000748",
        "C_00000000000000000000749", "C_00000000000000000000909", "C_00000000000000000000751", "C_00000000000000000000744", "C_00000000000000000000896",
        "C_00000000000000000000907"];

    sw_capa_aire = (jQuery.inArray(id_capa, id_capas_aire) == -1) ? false : true;
    return sw_capa_aire;

}

cuencasAsociadasNiveljson = {
    90: "C_00000000000000000000968",
    91: "C_00000000000000000000999",
    92: "C_00000000000000000000952",
    93: "C_00000000000000000000956",
    94: "C_00000000000000000000995",
    98: "C_00000000000000000001001",
    99: "C_00000000000000000000965",
    101: "C_00000000000000000001009",
    104: "C_00000000000000000001011",
    106: "C_00000000000000000001004",
    108: "C_00000000000000000000983",
    109: "C_00000000000000000000966",
    124: "C_00000000000000000000969",
    128: "C_00000000000000000001012",
    134: "C_00000000000000000000967",
    135: "C_00000000000000000000991",
    140: "C_00000000000000000001000",
    143: "C_00000000000000000001010",
    145: "C_00000000000000000000977",
    150: "C_00000000000000000000959",
    152: "C_00000000000000000000985",
    155: "C_00000000000000000000957",
    158: "C_00000000000000000001005",
    161: "C_00000000000000000001037",
    166: "C_00000000000000000001013",
    169: "C_00000000000000000000958",
    173: "C_00000000000000000000986",
    179: "C_00000000000000000000951",
    181: "C_00000000000000000000982",
    182: "C_00000000000000000000997",
    183: "C_00000000000000000000978",
    186: "C_00000000000000000000984",
    187: "C_00000000000000000000971",
    195: "C_00000000000000000001114",
    236: "C_00000000000000000000950",
    238: "C_00000000000000000001006",
    239: "C_00000000000000000000988",
    240: "C_00000000000000000000990",
    245: "C_00000000000000000000994",
    246: "C_00000000000000000000962",
    247: "C_00000000000000000000998",
    251: "C_00000000000000000001038",
    259: "C_00000000000000000000955",
    260: "C_00000000000000000000954",
    265: "C_00000000000000000000976",
    268: "C_00000000000000000000964",
    272: "C_00000000000000000000987",
    273: "C_00000000000000000000996",
    283: "C_00000000000000000001002",
    284: "C_00000000000000000000979",
    286: "C_00000000000000000000989",
    290: "C_00000000000000000001039",
    316: "C_00000000000000000000963",
    317: "C_00000000000000000000961",
    326: "C_00000000000000000000972",
    329: "C_00000000000000000001040",
    331: "C_00000000000000000000970",
    332: "C_00000000000000000001008",
    333: "C_00000000000000000000960",
    335: "C_00000000000000000000975",
    342: "C_00000000000000000000993",
    344: "C_00000000000000000000974",
    346: "C_00000000000000000000992",
    359: "C_00000000000000000001003",
    382: "C_00000000000000000000953",
    402: "C_00000000000000000001041",
    404: "C_00000000000000000001042",
    405: "C_00000000000000000001043",
    406: "C_00000000000000000001044",
    414: "C_00000000000000000001115",
    423: "C_00000000000000000001045",
    431: "C_00000000000000000001046",
    440: "C_00000000000000000001116",
    461: "C_00000000000000000001091",
    467: "C_00000000000000000001081",
    469: "C_00000000000000000001080",
    472: "C_00000000000000000001082",
    474: "C_00000000000000000001083",
    479: "C_00000000000000000001095",
    483: "C_00000000000000000001102",
    487: "C_00000000000000000001093",
    494: "C_00000000000000000001094",
    495: "C_00000000000000000001100",
    498: "C_00000000000000000001092",
    505: "C_00000000000000000001118",
    508: "C_00000000000000000001096",
    513: "C_00000000000000000001101",
    516: "C_00000000000000000001117",
    518: "C_00000000000000000001099",
    520: "C_00000000000000000001108",
    531: "C_00000000000000000001113",
    528: "C_00000000000000000001120",
    533: "C_00000000000000000001121",
    534: "C_00000000000000000001124",
    535: "C_00000000000000000001122",
    536: "C_00000000000000000001123",
    537: "C_00000000000000000001125",
    545: "C_00000000000000000000973",
    546: "C_00000000000000000001143",
    552: "C_00000000000000000001138",
    554: "C_00000000000000000000980",
    561: "C_00000000000000000001144",
    562: "C_00000000000000000001146",
    571: "C_00000000000000000001148",
    572: "C_00000000000000000001145",
    584: "C_00000000000000000001147",
    586: "C_00000000000000000001149",
    591: "C_00000000000000000001150",
    593: "C_00000000000000000001151",
    602: "C_00000000000000000001152",
    606: "C_00000000000000000001153",
    614: "C_00000000000000000001154",
    621: "C_00000000000000000001155",
    623: "C_00000000000000000001156",
    624: "C_00000000000000000001157",
    628: "C_00000000000000000001159",
    630: "C_00000000000000000001160",
    605: "C_00000000000000000001161",
    527: "C_00000000000000000001162",
    633: "C_00000000000000000001163",
    634: "C_00000000000000000001164",
};
