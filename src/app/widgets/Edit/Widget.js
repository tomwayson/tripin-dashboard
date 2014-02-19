///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2013 Esri. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    "esri/dijit/editing/Editor",
    "esri/layers/FeatureLayer",
    "dojo/dom-construct",
    "dojo/dom-style"
  ],
  function(
    declare,
    lang,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Editor,
    FeatureLayer,
    domConstruct,
    domStyle) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'Edit',
      baseClass: 'jimu-widget-edit',
      editor: null,
      layers: [],
      templateStyle: null,

      onOpen: function() {
        if (!this.config.editor.layerInfos || this.config.editor.layerInfos.length === 0) {
          return;
        }
        var len = this.config.editor.layerInfos.length;
        var layerInfos = this.config.editor.layerInfos;
        for (var i = 0; i < len; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = this.getLayerFromMap(featureLayer.url);
          if (!layer) {
            if(!layerInfos[i].featureLayer.options){
              layerInfos[i].featureLayer.options = {};
            }
            if(!layerInfos[i].featureLayer.options.outFields){
              if(layerInfos[i].fieldInfos){
                layerInfos[i].featureLayer.options.outFields = [];
                for(var j=0;j<layerInfos[i].fieldInfos.length;j++){
                  layerInfos[i].featureLayer.options.outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              }else{
                layerInfos[i].featureLayer.options.outFields = ["*"];
              }
              
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
            this.layers.push(layerInfos[i]);
          }
        }
        this.initEditor();
      },

      getLayerFromMap: function(url) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.url === url) {
            return layer;
          }
        }
        return null;
      },

      initEditor: function() {
        var json = this.config.editor;
        var settings = {};
        for (var attr in json) {
          settings[attr] = json[attr];
        }
        settings.map = this.map;

        var params = {
          settings: settings
        };
        if(!this.editDiv){
          this.editDiv = domConstruct.create("div", {
            style: {
              width: "100%",
              height: "100%"
            }
          });
          domConstruct.place(this.editDiv, this.domNode);
        }
        var height = domStyle.get(this.editDiv, "height");

        this.templateStyle = document.createElement('style');
        this.templateStyle.innerHTML = ".jimu-widget-edit .grid{ height: " + (height - 100) + "px;}";
        document.body.appendChild(this.templateStyle);

        this.editor = new Editor(params, this.editDiv);
        this.editor.startup();
      },

      onClose: function() {
        this.editor.destroy();
        this.layers.length = 0;
        this.editor = null;
        this.editDiv = domConstruct.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        });
        domConstruct.place(this.editDiv, this.domNode);
      }


    });
  });