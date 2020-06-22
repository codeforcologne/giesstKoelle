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

// FeatureInfo
/**
 * Elements that make up the popup.
 */
var lastId = '';
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

// vereinfachte Form tut es auch wie 2012-01-01
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

// legende
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

var sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><Name>veedel:trees</Name><UserStyle><FeatureTypeStyle>' +
    '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_0_5</Name><Title>alter_0_5</Title><Abstract>alter_0_5</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>5</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_0_5</Name><Title>alter_0_5</Title><Abstract>alter_0_5</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>5</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_6_15</Name><Title>alter_6_15</Title><Abstract>alter_6_15</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>6</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>15</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_6_15</Name><Title>alter_6_15</Title><Abstract>alter_6_15</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>6</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>15</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_16_39</Name><Title>alter_16_39</Title><Abstract>alter_16_39</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>16</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>39</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_16_39</Name><Title>alter_16_39</Title><Abstract>alter_16_39</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>16</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>39</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_40</Name><Title>alter_40</Title><Abstract>alter_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>40</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '<Rule><Name>alter_40</Name><Title>alter_40</Title><Abstract>alter_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>40</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
    '</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';


// open layers stuff


// baumkaster at large scales
wmsLayerSource = new ImageWMS({
    url: "https://www.opendem.info/geoserver/veedel/wms",
    //params: { LAYERS: "veedel:trees", SLD_BODY: sldBody },
    params: {
        LAYERS: "veedel:trees"
    },
    serverType: "geoserver",
    imageLoadFunction: function(image, src) {
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "arraybuffer";
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log('udn nun?');
                var arrayBufferView = new Uint8Array(this.response);
                var blob = new Blob([arrayBufferView], {
                    type: 'image/png'
                });
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(blob);
                image.getImage().src = imageUrl;
            }
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

// create location from  html parameters

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
        new SwitchControl()
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



if (getUrlVars()["xcoord"] == undefined) {

// geooaction api

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onPosition);
    }

    function onPosition(position) {
        map.getView().setCenter(transform([position.coords.longitude, position.coords.latitude, ], 'EPSG:4326', 'EPSG:3857'));
    }


} else {

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
                return response.text();
            })
            .then(function(json) {


                var fi = JSON.parse(json);
                var date = new Date(fi.features[0].properties.gegossen);
                date = date.toLocaleString({
                    dateStyle: 'short',
                    timeStyle: 'short'
                });
                var alter = fi.features[0].properties.alterschae;
                if (alter == -1) {
                    alter = "keine Angabe vorhanden"
                }
                var art = fi.features[0].properties.deutschern;
                if (art == null) {
                    art = "keine Angabe vorhanden"
                };
                var comment = fi.features[0].properties.comment;
                if (comment == null) {
                    comment = " "
                };
                var liter = fi.features[0].properties.liter;
                if (liter == null) {
                    liter = " ? "
                };
                lastId = fi.features[0].id;
                content.innerHTML =
                    "<p>Dieser Baum wurde das letzte mal gegossen am: " + date +
                    '<br/>mit ' + liter + ' Litern' +
                    '<br/>Geschätztes Alter: ' + alter +
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

    var sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><Name>veedel:trees</Name><UserStyle><FeatureTypeStyle>' +
        '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_unbekannt</Name><Title>alter_unbekannt</Title><Abstract>alter_unbekannt</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>-1</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>triangle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_0_5</Name><Title>alter_0_5</Title><Abstract>alter_0_5</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>5</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_0_5</Name><Title>alter_0_5</Title><Abstract>alter_0_5</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>0</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>5</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_6_15</Name><Title>alter_6_15</Title><Abstract>alter_6_15</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>6</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>15</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_6_15</Name><Title>alter_6_15</Title><Abstract>alter_6_15</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>6</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>15</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_16_39</Name><Title>alter_16_39</Title><Abstract>alter_16_39</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>16</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>39</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_16_39</Name><Title>alter_16_39</Title><Abstract>alter_16_39</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>16</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>39</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>star</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_40</Name><Title>alter_40</Title><Abstract>alter_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>40</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#00FF00</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '<Rule><Name>alter_40</Name><Title>alter_40</Title><Abstract>alter_40</Abstract><ogc:Filter><ogc:And><ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>alterschae</ogc:PropertyName><ogc:Literal>40</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyIsLessThan><ogc:PropertyName>gegossen</ogc:PropertyName><ogc:Literal>' + datum + '</ogc:Literal></ogc:PropertyIsLessThan></ogc:And></ogc:Filter><PointSymbolizer><Graphic><Mark><WellKnownName>x</WellKnownName><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke><Fill><CssParameter name="fill">#FF0000</CssParameter></Fill></Mark><Size>14</Size></Graphic></PointSymbolizer></Rule>' +
        '</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';


    wmsLayerSource = new ImageWMS({
        url: "https://www.opendem.info/geoserver/veedel/wms",
        //params: { LAYERS: "veedel:trees", SLD_BODY: sldBody },
        params: {
            LAYERS: "veedel:trees"
        },
        serverType: "geoserver",
        imageLoadFunction: function(image, src) {
            var xhttp = new XMLHttpRequest();
            xhttp.responseType = "arraybuffer";
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    console.log('udn nun?');
                    var arrayBufferView = new Uint8Array(this.response);
                    var blob = new Blob([arrayBufferView], {
                        type: 'image/png'
                    });
                    var urlCreator = window.URL || window.webkitURL;
                    var imageUrl = urlCreator.createObjectURL(blob);
                    image.getImage().src = imageUrl;
                }
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
                return response.text();
            })
            .then(function(json) {

                var fi = JSON.parse(json);
                var date = new Date(fi.features[0].properties.gegossen);
                date = date.toLocaleString({
                    dateStyle: 'short',
                    timeStyle: 'short'
                });
                var alter = fi.features[0].properties.alterschae;
                if (alter == -1) {
                    alter = "keine Angabe vorhanden"
                }
                var art = fi.features[0].properties.deutschern;
                if (art == null) {
                    art = "keine Angabe vorhanden"
                }
                var liter = fi.features[0].properties.liter;
                var comment = fi.features[0].properties.comment;
                if (comment == null) {
                    comment = " "
                };
                if (liter == null) {
                    liter = " ? "
                };
                var coordinate = evt.coordinate;
                lastId = fi.features[0].id;
                content.innerHTML =
                    "<p>Dieser Baum wurde das letzte mal gegossen am: " + date +
                    '<br/>mit ' + liter + ' Litern' +
                    '<br/>Geschätztes Alter: ' + alter +
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
    var url = 'https://openmaps.online/veedel/?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    copyStringToClipboard(url);
    alert('Der Link wurde in die Zwischenablage kopiert.');
}

function twitter() {
    var url = 'https://openmaps.online/veedel/?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('https://twitter.com/intent/tweet?url=' + url);
}

function whatsapp() {
    var url = 'https://openmaps.online/veedel/?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('whatsapp://send?text=' + url);
}

function facebook() {
    var url = 'https://openmaps.online/veedel/?ycoord=' + lastCoord[0] + '&xcoord=' + lastCoord[1] + '&zoom=' + map.getView().getZoom();
    url = encodeURIComponent(url);
    window.open('https://www.facebook.com/sharer.php?u=' + url);
}

// water teh tree --> request to Jave Servlet backend, since Geoserevr WFS-Transaction was not working

function giessen() {

    var id = lastId.split('.');
    var liter = document.getElementById('liter').value;
    var comment = document.getElementById('comment').value;


    var url = 'https://opendem.info/Trees/Trees?ogc_fid=' + id[1] + '&comment=' + comment + '&liter=' + liter;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            alert('Danke für´s Gießen!\n Du kannst dieses Ereignis jetzt über die sozialen Netzwerke teilen wenn Du magst.')
            document.getElementById('sharing').style.display = 'block';
            wmsLayerSource.refresh();
        }

    };
    xhttp.onerror = function() {
        alert("Leider ist etwas schief gelaufen.");
    };

    xhttp.open("Get", url, true);
    xhttp.setRequestHeader("Content-type", "text/html");
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


function copyStringToClipboard(str) {
    // Temporäres Element erzeugen
    var el = document.createElement('textarea');
    // Den zu kopierenden String dem Element zuweisen
    el.value = str;
    // Element nicht editierbar setzen und aus dem Fenster schieben
    el.setAttribute('readonly', '');
    el.style = {
        position: 'absolute',
        left: '-9999px'
    };
    document.body.appendChild(el);
    // Text innerhalb des Elements auswählen
    el.select();
    // Ausgewählten Text in die Zwischenablage kopieren
    document.execCommand('copy');
    // Temporäres Element löschen
    document.body.removeChild(el);
}

function documentLoaded(e) {
    // handle very small displays
    if (innerWidth < 400) {
        var title = document.getElementById("titleApp");
        title.style.fontSize = "1.2rem";
        title.style.top = "0px";
    }
}
document.addEventListener("DOMContentLoaded", documentLoaded);