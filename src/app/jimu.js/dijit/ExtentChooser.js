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
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dijit/_WidgetBase',
  'esri/arcgis/utils',
],
function(declare, lang, html, array, on, _WidgetBase, agolUtils) {
  return declare([_WidgetBase], {
    baseClass: 'jimu-extent-chooser',

    //itemId: String
    //  the webmap item id. For now, we only support webmap
    itemId: null,

    //bingMapsKey: String
    //  required if working with Microsoft Bing Maps
    bingMapsKey: '',

    postCreate:function(){
      this.inherited(arguments);

      var mapNode = html.create('div', {
        style: {
          width: '100%',
          height: '100%'
        }
      }, this.domNode);
      
      if(!this.itemId){
        return;
      }
      var mapDeferred = agolUtils.createMap(this.itemId,
      mapNode, {
        bingMapsKey: this.bingMapsKey
      });

      mapDeferred.then(lang.hitch(this, function(response) {
        this.map = response.map;
        this.own(on(this.map, 'extent-change', lang.hitch(this, function(evt){
          this.onExtentChange(evt.extent);
        })));
        this.onExtentChange(this.map.extent);
      }));

    },

    getExtent: function(){
      return this.map.extent;
    },

    setExtent: function(extent){
      return this.map.setExtent(extent);
    },

    onExtentChange: function(extent){
      /* jshint unused:false */
    }

  });
});