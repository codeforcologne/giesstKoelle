import 'ol/ol.css';
import {
    Map,
    View
} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import ImageWMS from "ol/source/ImageWMS";
import ImageLayer from "ol/layer/Image";
import {
    addProjection,
    addCoordinateTransforms,
    transform
} from 'ol/proj';
import Overlay from "ol/Overlay";
import {
    defaults as defaultControls,
    Control
} from "ol/control";

var lastid = '';
var datum;
var container = document.getElementById("popup");
var content = document.getElementById("popup-content");
var closer = document.getElementById("popup-closer");
var startDate = new Date();
var datum;
var wmsLayerSource;
var wmsLayer;
var lastCoord;
var lastZoom;

// test
//var veedel_layer = 'veedel:treestest';
//var linkEditor = 'http://openmaps.online/pflegen/';
//var pyUrl = 'https://opendem.info/cgi-bin/test/';
//var linkSocial = 'https://openmaps.online/veedel/';

// Prod
var veedel_layer = 'veedel:trees';
var linkEditor = 'https://giesst.koeln/editor/';
var pyUrl = 'https://opendem.info/cgi-bin/';
var linkSocial = 'https://giesst.koeln/';

var startDate = new Date;
startDate = new Date(startDate.setDate(startDate.getDate() - 7));
var yearbegin = startDate.getFullYear();
var monthbegin = startDate.getMonth() + 1;
if (monthbegin < 10) {
    monthbegin = "0" + monthbegin;
}
var daybegin = startDate.getDate();
if (daybegin < 10) {
    daybegin = "0" + daybegin;
}
datum = yearbegin + "-" + monthbegin + "-" + daybegin;

/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250,
    },
});
/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

// Location
var LocationControl = /*@__PURE__*/ (function(Control) {
    function LocationControl(opt_options) {
        var options = opt_options || {};
        var LocationDiv = document.createElement("div");
        LocationDiv.style.cssText =
            "position:absolute;top:420px;left:8px; width:30px; height:30px;";
        LocationDiv.className = "LocationDiv";
        LocationDiv.id = "LocationDiv";
        Control.call(this, {
            element: LocationDiv,
            target: options.target,
        });
        LocationDiv.addEventListener(
            "click",
            this.handleLocationDivChange.bind(this),
            false
        );
    }
    if (Control) LocationControl.__proto__ = Control;
    LocationControl.prototype = Object.create(Control && Control.prototype);
    LocationControl.prototype.constructor = LocationControl;
    LocationControl.prototype.handleLocationDivChange = function handleSelection() {

        navigator.geolocation.getCurrentPosition(onPosition);


        function onPosition(position) {
            map.getView().setCenter(transform([position.coords.longitude, position.coords.latitude, ], 'EPSG:4326', 'EPSG:3857'));
        }

    };
    return LocationControl;
})(Control);

// legend
var LegendControl = /*@__PURE__*/ (function(Control) {
    function LegendControl(opt_options) {
        var options = opt_options || {};

        var image = document.createElement('IMG');
        image.id = 'legendimg';
        image.src = 'legende.png';
        image.title = 'Legende';


        var element = document.createElement('div');
        element.id = 'legend_controll';
        element.style.cssText = 'position:absolute;top:15px;left:10px;';
        element.className = 'ol-unselectable ol-control';
        element.appendChild(image);

        Control.call(this, {
            element: element,
            target: options.target
        });

        image.addEventListener('click', this.handleLegend.bind(this), false);
    }

    if (Control) LegendControl.__proto__ = Control;
    LegendControl.prototype = Object.create(Control && Control.prototype);
    LegendControl.prototype.constructor = LegendControl;

    LegendControl.prototype.handleLegend = function handleLegend() {

    };

    return LegendControl;
}(Control));

// Custom Control Toggle Legend for more space for mobile applications
var SwitchControl = /*@__PURE__*/ (function(Control) {
    function SwitchControl(opt_options) {
        var options = opt_options || {};
        var switchDiv = document.createElement("div");
        switchDiv.style.cssText =
            "position:absolute;top:0px;left:1px; width:30px; height:30px;";
        switchDiv.className = "switchDiv";
        switchDiv.id = "switchDiv";
        Control.call(this, {
            element: switchDiv,
            target: options.target,
        });
        switchDiv.addEventListener(
            "click",
            this.handleSwitchDivChange.bind(this),
            false
        );
    }
    if (Control) SwitchControl.__proto__ = Control;
    SwitchControl.prototype = Object.create(Control && Control.prototype);
    SwitchControl.prototype.constructor = SwitchControl;
    SwitchControl.prototype.handleSwitchDivChange = function handleSelection() {
        var selfDiv = document.getElementById("switchDiv");
        var controlEle = document.getElementById("legend_controll");
        var timesliderEle = document.getElementById("timeslider");
        if (controlEle.style.display === "none") {
            controlEle.style.display = "block";
            timesliderEle.style.display = "block";
            selfDiv.className = "switchDiv";
        } else {
            controlEle.style.display = "none";
            timesliderEle.style.display = "none";
            selfDiv.className = "switchDivHide";
        }
    };
    return SwitchControl;
})(Control);

// custom controller timeslider
var TimesliderControl = /*@__PURE__*/ (function(Control) {
    function TimesliderControl(opt_options) {
        var options = opt_options || {};
        var buttonBack = document.createElement("button");
        buttonBack.innerHTML = "<";
        var buttonForward = document.createElement("button");
        buttonForward.innerHTML = ">";
        var textTimeslider = document.createElement("div");
        textTimeslider.id = "textTimeslider";
        textTimeslider.innerHTML = datum;
        var element = document.createElement("div");
        element.style.cssText = "position:absolute;top:250px;left:10px;";
        element.className = "ol-unselectable ol-control timeslider";
        element.id = "timeslider";
        element.appendChild(buttonBack);
        element.appendChild(textTimeslider);
        element.appendChild(buttonForward);
        Control.call(this, {
            element: element,
            target: options.target,
        });
        buttonBack.addEventListener("click", this.handleBack.bind(this), false);
        buttonForward.addEventListener(
            "click",
            this.handleForward.bind(this),
            false
        );
    }
    if (Control) TimesliderControl.__proto__ = Control;
    TimesliderControl.prototype = Object.create(Control && Control.prototype);
    TimesliderControl.prototype.constructor = TimesliderControl;
    TimesliderControl.prototype.handleBack = function handleBack() {
        startDate = new Date(startDate.setDate(startDate.getDate() - 1));
        var yearbegin = startDate.getFullYear();
        var monthbegin = startDate.getMonth() + 1;
        if (monthbegin < 10) {
            monthbegin = "0" + monthbegin;
        }
        var daybegin = startDate.getDate();
        if (daybegin < 10) {
            daybegin = "0" + daybegin;
        }
        datum = yearbegin + "-" + monthbegin + "-" + daybegin;

        document.getElementById("textTimeslider").innerHTML = datum;
        updateWMS();

    };
    TimesliderControl.prototype.handleForward = function handleForward() {


        startDate = new Date(startDate.setDate(startDate.getDate() + 1));

        if (startDate > Date.now()) {
            alert('Küss de hück nit, küss de morje.')
        }
        var yearbegin = startDate.getFullYear();
        var monthbegin = startDate.getMonth() + 1;
        if (monthbegin < 10) {
            monthbegin = "0" + monthbegin;
        }
        var daybegin = startDate.getDate();
        if (daybegin < 10) {
            daybegin = "0" + daybegin;
        }
        datum = yearbegin + "-" + monthbegin + "-" + daybegin;
        document.getElementById("textTimeslider").innerHTML = datum;
        updateWMS();

    };
    return TimesliderControl;
})(Control);

// age_groups  0: <= 25 | 1: 26 - 40 | 2: > 40  < -1 = unbekannt

var sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><Name>' + veedel_layer + '</Name><UserStyle><FeatureTypeStyle>' +
    '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_bis_gleich_25</Name><Title>alter_bis_gleich_25</Title><Abstract>alter_bis_gleich_25</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_bis_gleich_25</Name><Title>alter_bis_gleich_25</Title><Abstract>alter_bis_gleich_25</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_26_bis_40</Name><Title>alter_26_bis_40</Title><Abstract>alter_26_bis_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_26_bis_40</Name><Title>alter_26_bis_40</Title><Abstract>alter_26_bis_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_grosser_40</Name><Title>alter_grosser_40</Title><Abstract>alter_grosser_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>2</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_grosser_40</Name><Title>alter_grosser_40</Title><Abstract>alter_grosser_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>2</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>untergrund</Name><Title>untergrund</Title><Abstract>untergrund</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>subsoil</ogc:PropertyName><ogc:Literal>true</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>untergrund</Name><Title>untergrund</Title><Abstract>untergrund</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>subsoil</ogc:PropertyName><ogc:Literal>true</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

// open layers stuff

// baumkaster at large scales
wmsLayerSource = new ImageWMS({
    url: "https://www.opendem.info/geoserver/veedel/wms",
    params: {
        LAYERS: veedel_layer
    },
    serverType: "geoserver",
    imageLoadFunction: function(image, src) {
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "arraybuffer";
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var arrayBufferView = new Uint8Array(this.response);
                var blob = new Blob([arrayBufferView], {
                    type: 'image/png'
                });
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(blob);
                image.getImage().src = imageUrl;
            }
        };
        xhttp.onerror = function() {
            alert("Leider ist etwas schief gelaufen.");
        };
        xhttp.open("POST", src, true);
        xhttp.setRequestHeader("Content-type", "text/xml");
        xhttp.send(sldBody);
    },
    crossOrigin: "anonymous",
    attributions: ', <a target="_blank" href="https://offenedaten-koeln.de/dataset/baumkataster-koeln">Stadt Köln CC BY 3.0 DE</a>',
});


wmsLayer = new ImageLayer({
    source: wmsLayerSource,
    maxResolution: 2,
    className: 'wmsLayer'
});

// load icon handling 
wmsLayerSource.on('imageloadstart', function() {
    document.getElementById('loader').style.display = 'block';
});

wmsLayerSource.on('imageloadend', function() {
    document.getElementById('loader').style.display = 'none';
});

// baumkataster overviews
var wmsLayerSourceOverview = new ImageWMS({
    url: "https://opendem.info/cgi-bin/mapserv?map=/home/trees/trees.map",
    params: {
        LAYERS: "trees"
    },
    serverType: "mapserver",
    crossOrigin: "anonymous",
    attributions: ', <a target="_blank" href="https://offenedaten-koeln.de/dataset/baumkataster-koeln">Stadt Köln CC BY 3.0 DE</a>',
});

// baumkataster overviews load icon handling 
wmsLayerSourceOverview.on('imageloadstart', function() {
    document.getElementById('loader').style.display = 'block';
});

wmsLayerSourceOverview.on('imageloadend', function() {
    document.getElementById('loader').style.display = 'none';
});

var wmsLayerOverview = new ImageLayer({
    source: wmsLayerSourceOverview,
    minResolution: 2
});

// url parameter coordinates

var zoomView = 17;
var ycoord = 774670.0;
var xcoord = 6610915.0;

try {
    if (getUrlVars()["y"] != undefined) {
        ycoord = parseFloat(getUrlVars()["y"]);
    }
} catch (e) {}

try {
    if (getUrlVars()["x"] != undefined) {
        xcoord = parseFloat(getUrlVars()["x"]);
    }
} catch (e) {}

// lat lon
try {
    if (getUrlVars()["xcoord"] != undefined) {
        xcoord = parseFloat(getUrlVars()["xcoord"]);
    }
} catch (e) {}
try {
    if (getUrlVars()["ycoord"] != undefined) {
        ycoord = parseFloat(getUrlVars()["ycoord"]);
    }
} catch (e) {}
try {
    if (getUrlVars()["zoomView"] != undefined) {
        zoomView = Number(getUrlVars()["zoomView"]);
    }
} catch (e) {}

// Map
var view = new View({
    center: [ycoord, xcoord],
    zoom: zoomView,
});
var map = new Map({
    controls: defaultControls().extend([
        new LegendControl(),
        new TimesliderControl(),
        new SwitchControl(),
        new LocationControl()
    ]),
    layers: [
        new TileLayer({
            source: new OSM(),
        }),
        wmsLayer, wmsLayerOverview
    ],
    target: "map",
    overlays: [overlay],
    view: view,
});

if (getUrlVars()["xcoord"] == undefined && getUrlVars()["x"] == undefined) {

    // geooaction api
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onPosition);
    }

    function onPosition(position) {
        map.getView().setCenter(transform([position.coords.longitude, position.coords.latitude, ], 'EPSG:4326', 'EPSG:3857'));
    }


} else if (getUrlVars()["xcoord"] !== undefined) {

    // open feature info from parameters if html parameters exits

    var coords = [ycoord, xcoord];
    var viewResolution = /** @type {number} */ (view.getResolution());
    var url = wmsLayerSource.getFeatureInfoUrl(
        coords,
        viewResolution,
        "EPSG:3857", {
            INFO_FORMAT: "application/json"
        }
    );

    if (url) {
        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    alert('Irgendwas ist leider schief gegangen.');
                } else {
                    return response.text();
                }
            })
            .then(function(json) {


                var fi = JSON.parse(json);
                var date = fi.features[0].properties.watered_at;
                if (date == null) {
                    date = " ";
                } else {
                    date = new Date(date);
                    date = date.toLocaleDateString('de-DE');
                }

                var alter = fi.features[0].properties.age_group;
                switch (alter) {
                    case 0:
                        alter = "<= 25 Jahre"
                        break;
                    case 1:
                        alter = "25 - 40 Jahre"
                        break;
                    case 2:
                        alter = "> 40 Jahre"
                        break;
                    default:
                        alter = "keine Angabe vorhanden"
                }

                var art = fi.features[0].properties.name_ger;
                if (art == null) {
                    art = "keine Angabe vorhanden"
                };
                var comment = fi.features[0].properties.comment;
                if (comment == null) {
                    comment = " "
                };
                var liter = fi.features[0].properties.watered;
                if (liter == null) {
                    liter = "mit ? Litern"
                } else if (liter == '9mm Niederschlag') {
                    liter = 'mit 9mm Niederschlag'
                } else {
                    liter = "mit " + liter + " Litern";
                };

                lastid = fi.features[0].properties.tree_id;
                content.innerHTML =
                    "<p>Dieser Baum wurde das letzte mal gegossen am: " + date +
                    '<br/>' + liter +
                    '<br/>Geschätzte Altersklasse: ' + alter +
                    '<br/>Art: ' + art +
                    '<br/>Kommentar: ' + comment + '</p>';
                overlay.setPosition(coords);
            });
    }
}

// map events

// change Legend depending on zoom & wms
map.getView().on('change:resolution', function(e) {

    var mapZoom = parseInt(view.getZoom(), 10);
    var legendimg = document.getElementById('legendimg')

    if (mapZoom < 16) {

        if (legendimg.src.indexOf("legende.png") > -1) {
            legendimg.src = "legende_overview.png";
        }
    } else {
        if (legendimg.src.indexOf("legende_overview.png") > -1) {
            legendimg.src = "legende.png";
        }
    }
});

// update WMS
function updateWMS() {
    // not so beautiful, but setImageLoadFunction was not working
    var layers = map.getLayers().getArray();;

    for (var i = layers.length - 1; i >= 0; i--) {
        console.log(layers[i].className_);
        if (layers[i].className_ == 'wmsLayer') {
            map.removeLayer(layers[i]);
        }
    }

    var sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><Name>' + veedel_layer + '</Name><UserStyle><FeatureTypeStyle>' +
        '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_bis_gleich_25</Name><Title>alter_bis_gleich_25</Title><Abstract>alter_bis_gleich_25</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_bis_gleich_25</Name><Title>alter_bis_gleich_25</Title><Abstract>alter_bis_gleich_25</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_26_bis_40</Name><Title>alter_26_bis_40</Title><Abstract>alter_26_bis_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_26_bis_40</Name><Title>alter_26_bis_40</Title><Abstract>alter_26_bis_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>1</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_grosser_40</Name><Title>alter_grosser_40</Title><Abstract>alter_grosser_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>2</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_grosser_40</Name><Title>alter_grosser_40</Title><Abstract>alter_grosser_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>age_group</ogc:PropertyName><ogc:Literal>2</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>untergrund</Name><Title>untergrund</Title><Abstract>untergrund</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>subsoil</ogc:PropertyName><ogc:Literal>true</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>untergrund</Name><Title>untergrund</Title><Abstract>untergrund</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>subsoil</ogc:PropertyName><ogc:Literal>true</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>watered_at</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

    wmsLayerSource = new ImageWMS({
        url: "https://www.opendem.info/geoserver/veedel/wms",
        params: {
            LAYERS: veedel_layer
        },
        serverType: "geoserver",
        imageLoadFunction: function(image, src) {
            var xhttp = new XMLHttpRequest();
            xhttp.responseType = "arraybuffer";
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var arrayBufferView = new Uint8Array(this.response);
                    var blob = new Blob([arrayBufferView], {
                        type: 'image/png'
                    });
                    var urlCreator = window.URL || window.webkitURL;
                    var imageUrl = urlCreator.createObjectURL(blob);
                    image.getImage().src = imageUrl;
                }
            };
            xhttp.onerror = function() {
                alert("Leider ist etwas schief gelaufen.");
            };
            xhttp.open("POST", src, true);
            xhttp.setRequestHeader("Content-type", "text/xml");
            xhttp.send(sldBody);
        },
        crossOrigin: "anonymous",
        attributions: ', <a target="_blank" href="https://offenedaten-koeln.de/dataset/baumkataster-koeln">Stadt Köln CC BY 3.0 DE</a>',
    });


    wmsLayerSource.on('imageloadstart', function() {
        document.getElementById('loader').style.display = 'block';
    });

    wmsLayerSource.on('imageloadend', function() {
        document.getElementById('loader').style.display = 'none';
    });

    wmsLayer = new ImageLayer({
        source: wmsLayerSource,
        maxResolution: 2,
        className: 'wmsLayer'
    });

    map.addLayer(wmsLayer);

}

// FeatureInfo
map.on("singleclick", function(evt) {
    var viewResolution = /** @type {number} */ (view.getResolution());
    var url = wmsLayerSource.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        "EPSG:3857", {
            INFO_FORMAT: "application/json"
        }
    );

    lastCoord = evt.coordinate;

    if (url) {
        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    alert('Irgendwas ist leider schief gegangen.');
                } else {
                    return response.text();
                }
            })
            .then(function(json) {

                var fi = JSON.parse(json);
                var date = fi.features[0].properties.watered_at;
                if (date == null) {
                    date = " ";
                } else {
                    date = new Date(date);
                    date = date.toLocaleDateString('de-DE');
                }
                var alter = fi.features[0].properties.age_group;
                switch (alter) {
                    case 0:
                        alter = "<= 25 Jahre"
                        break;
                    case 1:
                        alter = "26 - 40 Jahre"
                        break;
                    case 2:
                        alter = "> 40 Jahre"
                        break;
                    default:
                        alter = "keine Angabe vorhanden"
                }
                var art = fi.features[0].properties.name_ger;
                if (art == null) {
                    art = "keine Angabe vorhanden"
                }
                var liter = fi.features[0].properties.watered;
                var comment = fi.features[0].properties.comment;
                if (comment == null) {
                    comment = " "
                };
                if (liter == null) {
                    liter = "mit ? Litern"
                } else if (liter == '9mm Niederschlag') {
                    liter = 'mit 9mm Niederschlag'
                } else {
                    liter = "mit " + liter + " Litern";
                };

                var coordinate = evt.coordinate;
                lastid = fi.features[0].properties.tree_id;
                content.innerHTML =
                    "<p>Dieser Baum wurde das letzte mal gegossen am: " + date +
                    '<br/>' + liter +
                    '<br/>Geschätzte Altersklasse: ' + alter +
                    '<br/>Art: ' + art +
                    '<br/>Kommentar: ' + comment + '</p>' +
                    '<p> <button id="giessen" >Ich habe den Baum heute gegossen</button> ' +
                    '<p><label for="liter">mit Litern:</label><select name="liter" id="liter"><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></p> ' +
                    '<label for="comment">Kommentar:</label><input type="text" id="comment" name="comment" maxlength="40">' +
                    '<div id="sharing" style="display: none;" ><p>' +
                    '<img style="height:32px;width:32px;margin-right: 5px;" id="facebook" src="facebook_web.svg">' +
                    '<img style="height:32px;width:32px;margin-right: 5px;" id="whatsapp" src="whatsapp.svg"> ' +
                    '<img style="height:32px;width:32px;margin-right: 5px;" id="twitter" src="twitter.svg"> ' +
                    '<img width="32" height="32" id="share" src="Sharethis.svg">' +
                    '</p></div>';

                overlay.setPosition(coordinate);
                document.getElementById("giessen").addEventListener("click", giessen);
                document.getElementById("facebook").addEventListener("click", facebook);
                document.getElementById("whatsapp").addEventListener("click", whatsapp);
                document.getElementById("twitter").addEventListener("click", twitter);
                document.getElementById("share").addEventListener("click", share);
            });
    }
});

// social stuff 
function share() {
    var url = linkSocial + '?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    copyStringToClipboard(url);
    alert('Der Link wurde in die Zwischenablage kopiert.');
}

function twitter() {
    var url = linkSocial + '?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('https://twitter.com/intent/tweet?url=' + url);
}

function whatsapp() {
    var url = linkSocial + '?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('whatsapp://send?text=' + url);
}

function facebook() {
    var url = linkSocial + '?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('https://www.facebook.com/sharer.php?u=' + url);
}

// water the tree
function giessen() {

    var liter = document.getElementById('liter').value;
    var comment = document.getElementById('comment').value;
    var url = pyUrl + 'watered.py?id=' + lastid + '&comment=' + comment + '&liter=' + liter;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            try {
                var res = JSON.parse(this.response);
                if (res.request === 'done') {
                    alert('Danke für´s Gießen!\n Du kannst dieses Ereignis jetzt über die sozialen Netzwerke teilen wenn Du magst.')
                    document.getElementById('sharing').style.display = 'block';
                    wmsLayerSource.refresh();
                } else {
                    alert("Leider ist etwas schief gelaufen.");
                }
            } catch (e) {
                alert("Leider ist etwas schief gelaufen.");
            }
        }
    };
    xhttp.onerror = function() {
        alert("Leider ist etwas schief gelaufen.");
    };
    xhttp.open("Get", url, true);
    xhttp.send();
}

// help
document.getElementById("helpIcon").addEventListener("click", help);

function help() {
    document.getElementById("help").style.display = "block";
    document.getElementById("head").style.pointerEvents = "none";
    document.getElementById("head").style.opacity = "50%";
    document.getElementById("map").style.pointerEvents = "none";
    document.getElementById("map").style.opacity = "50%";
}
document.getElementById("closeHelp").addEventListener("click", closeHelp);

function closeHelp() {
    document.getElementById("help").style.display = "none";
    document.getElementById("head").style.pointerEvents = "auto";
    document.getElementById("head").style.opacity = "1";
    document.getElementById("map").style.pointerEvents = "auto";
    document.getElementById("map").style.opacity = "1";
}
// legal notes
document.getElementById("legalIcon").addEventListener("click", legal);

function legal() {
    document.getElementById("legal").style.display = "block";
    document.getElementById("head").style.pointerEvents = "none";
    document.getElementById("head").style.opacity = "50%";
    document.getElementById("map").style.pointerEvents = "none";
    document.getElementById("map").style.opacity = "50%";
}
document.getElementById("closeLegal").addEventListener("click", closeLegal);

function closeLegal() {
    document.getElementById("legal").style.display = "none";
    document.getElementById("head").style.pointerEvents = "auto";
    document.getElementById("head").style.opacity = "1";
    document.getElementById("map").style.pointerEvents = "auto";
    document.getElementById("map").style.opacity = "1";
}

// get url parameters helper
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

document.getElementById("editIcon").addEventListener("click", baumkataster);

function baumkataster() {
    var txt;
    var r = confirm("Hier kannst Du mit dem Kartenausschnitt zum Editor wechseln");
    if (r == true) {
        var center = map.getView().getCenter();
        var zoom = map.getView().getZoom();
        window.open(linkSocial + "editor/?y=" + center[0] + "&x=" + center[1] + "&zoomView=" + zoom);

    } else {

    }
}

function copyStringToClipboard(str) {
    var el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style = {
        position: 'absolute',
        left: '-9999px'
    };
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function documentLoaded(e) {
    // handle very small displays
    if (innerWidth < 350) {
        var title = document.getElementById("titleApp");
        title.innerHTML = '&nbsp;GießtKölle&nbsp;';
        title.style.fontSize = "1.8rem";
        title.style.color = "white";
        title.classList.add("title");
        title.style.top = "10px";
    }
}
document.addEventListener("DOMContentLoaded", documentLoaded);