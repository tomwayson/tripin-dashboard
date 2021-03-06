define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/Color',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/List',
  'jimu/utils',
  './EventEditor',
  './EventList',
  'esri/layers/FeatureLayer',
  'esri/renderers/Renderer',
  'esri/renderers/SimpleRenderer',
  'esri/renderers/UniqueValueRenderer',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/InfoTemplate',
  'dojo/request/xhr'
], function(declare,
  lang,
  array,
  Color,
  _WidgetsInTemplateMixin,
  BaseWidget,
  TabContainer,
  List,
  utils,
  EventEditor,
  EventList,
  FeatureLayer,
  Renderer,
  SimpleRenderer,
  UniqueValueRenderer,
  PictureMarkerSymbol,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  InfoTemplate,
  xhr) {

  var activityInfoTemplateContent = '<div class="tripin-info"><div class="tripin-info-name">${NAME}</div><div class="tripin-info-count">${ATTENDEE_COUNT} attendee(s)</div><div class="tripin-info-date">${DATE}</div><div class="tripin-info-description">${DESCRIPTION}</div><div class="tripin-info-social"><img src="images/share.gif" /></div></div>';
  var eventInfoTemplateContent    = '<div class="tripin-info"><div class="tripin-info-name">${NAME}</div><div class="tripin-info-description">${DESCRIPTION}</div><div class="tripin-info-date">${END_DATE}</div><div class="">${BUSINESSID}</div><div class="tripin-info-social"><img src="images/share.gif" /></div></div>';
  
  var activityAttendeeCache = {};

  var ActivityAttendeesRenderer = declare(Renderer, {
    config: null,
    constructor: function(args) {
      lang.mixin(this, args);
    },
    getSymbol: function (graphic) {
      var symbol = null;
      var activityAttendeeCount = 0;

      if (activityAttendeeCache.hasOwnProperty(graphic.attributes.ACTIVITYID)) {
        activityAttendeeCount = activityAttendeeCache[graphic.attributes.ACTIVITYID];
      } else {
        xhr(this.config.trackingTableService + this.config.trackingTableQuery, {
          sync: true,
          handleAs: 'json'
        }).then(function(data) {
          array.forEach(data.features || [], function(feature) {
            activityAttendeeCache[graphic.attributes.ACTIVITYID] =  Math.min(feature.attributes.ACTIVITY_COUNT, 11);
            if (feature.attributes.ACTIVITY_ID === graphic.attributes.ACTIVITYID) {
              activityAttendeeCount = activityAttendeeCache[graphic.attributes.ACTIVITYID];
            }
          });
        },
        function(error) {
          console.group('ActivityAttendeesRenderer::getSymbol');
          console.error(error);
          console.groupEnd('ActivityAttendeesRenderer::getSymbol');
        });
      }

      if (activityAttendeeCount > 0) {
        graphic.attributes.ATTENDEE_COUNT = activityAttendeeCount;
        symbol = new PictureMarkerSymbol({
          url:     'images/symbols/' + activityAttendeeCount + '.png',
          type:    'esriPMS',
          //xoffset: -8,
          yoffset: 11,
          width:   16,
          height:  23
        });
      }

      if (symbol === null) {
        symbol = new SimpleMarkerSymbol();
      }
      return symbol;
    }
  });

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'TripIn',
    baseClass: 'tripin-workflow-parent',
    eventEditor: null,
    postCreate: function() {
      this.inherited(arguments);

      // create the feature layer for the events service
      this.eventsFeatureLayer =  new FeatureLayer(this.config.eventsFeatureService, {
        outFields: ['*'],
        infoTemplate: new InfoTemplate("TripIn Event", eventInfoTemplateContent)
      });
      var eventsRenderer = new UniqueValueRenderer(
        new SimpleMarkerSymbol(
          "circle",
          10,
          new SimpleLineSymbol("solid", new Color([196, 33, 41]), 1),
          new Color([0, 103, 163])
        ),
        'BUSINESSID_1');
      eventsRenderer.addValue(286, new SimpleMarkerSymbol(
        "circle",
        12,
        new SimpleLineSymbol("solid", new Color([196, 33, 41]), 1),
        new Color([241, 196, 15]) // 196, 33, 41 46, 204, 113
      ));
      this.eventsFeatureLayer.setRenderer(eventsRenderer);
      this.map.addLayer(this.eventsFeatureLayer);

      // create the feature layer for the activities service
      this.activitiesFeatureLayer = new FeatureLayer(this.config.activitiesFeatureService, {
        outFields: ['*'],
        mode: FeatureLayer.MODE_SNAPSHOT,
        infoTemplate: new InfoTemplate("TripIn Activity", activityInfoTemplateContent)
      });
      this.activitiesFeatureLayer.setRenderer(new ActivityAttendeesRenderer({
        config: this.config
      }));
      this.map.addLayer(this.activitiesFeatureLayer);

      // widgets
      this.eventList = new EventList({
        title:        'My Events',
        featureLayer: this.eventsFeatureLayer,
        businessId:   286
      });

      this.eventEditor = new EventEditor({
        title:        'Add Event',
        featureLayer: this.eventsFeatureLayer,
        businessId:   286
      });
      this.own(this.newEventButton.on('Click', lang.hitch(this, function(/*e*/) {
        if (!this.eventEditor.isOpen) {
          this.eventEditor.open();
        }
      })));
      this.own(this.map.on('time-extent-change', lang.hitch(this, function(/*e*/) {
        // var timeExtent = e.timeExtent;
        this.refreshTimeExtent();
      })));
      this.refreshTimeExtent();
    },

    // time extent
    refreshTimeExtent: function() {
      var timeExtent = this.map.timeExtent;
      this.startTimeNode.innerHTML = timeExtent.startTime.toLocaleDateString();
      this.endTimeNode.innerHTML = timeExtent.endTime.toLocaleDateString();
    },

    startup: function() {
      window.MAP = this.map;
      this.inherited(arguments);
      console.log('TripIn::startup()');
      this.eventList.placeAt(this.containerNode);
      this.eventEditor.placeAt(this.containerNode);
      this.eventEditor.close();
    },
    onOpen: function() {
      this.inherited(arguments);
      console.log('TripIn::onOpen()');
    },
    onClose: function() {
      console.log('TripIn::onClose()');
    }
  });
});