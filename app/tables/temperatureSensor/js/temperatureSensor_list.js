/**
 * This is the file that will create the list view for the tea inventory table.
 */
/* global $, control, data */
'use strict';

if (JSON.parse(control.getPlatformInfo()).container === 'Chrome') {
    console.log('Welcome to Tables debugging in Chrome!');
    $.ajax({
        url: control.getFileAsUrl('output/debug/Tea_inventory_data.json'),
        async: false,  // do it first
        success: function(dataObj) {
            window.data.setBackingObject(dataObj);
        }
    });
}

var uniqueSensorIds = [];
var uniqueSensorIdToRowIdMap = {};

/* Called when page loads to display things (Nothing to edit here) */
var resumeFn = function(idxStart) {
    console.log('resumeFn called. idxStart: ' + idxStart);
    // The first time through we're going to make a map sensorId and
    // a rowId for that sensorId
    var sensorIdMap = [];
    if (idxStart === 0) {
        var tempData = control.query('temperatureSensor', null, null);
        for (var i = 0; i < tempData.getCount(); i++) {
            console.log('tempData.getData: ' + tempData.getData(i, 'sensorid'));
            sensorIdMap[i] =
                tempData.getData(i, 'sensorid');
        }
       
        // Use underscore to get only unique id's for the list
        uniqueSensorIds = _.uniq(sensorIdMap);   

        // Now get the last index of from the sensorIdMap and create a map of
        // rowIds and sensorids
        for (var j = 0; j < uniqueSensorIds.count; j++) {
            var index = _.lastIndexOf(sensorIdMap, uniqueSensorIds[j]);
            uniqueSensorIdToRowIdMap[uniqueSensorIds[j]] = index;
        }     

        // We're also going to add a click listener on the wrapper ul that will
        // handle all of the clicks on its children.
        $('#list').click(function(e) {
            var tableId = data.getTableId();
            // We set the rowId for the li. However, we may have
            // clicked on the li or anything in the li. Thus we need to get
            // the original li, which we'll do with jQuery's closest()
            // method. First, however, we need to wrap up the target
            // element in a jquery object.
            // wrap up the object so we can call closest()
            var jqueryObject = $(e.target);
            // we want the closest thing with class item_space, which we
            // have set up to have the row id
            var containingDiv = jqueryObject.closest('.item_space');
            var rowId = containingDiv.attr('rowId');
            console.log('clicked with rowId: ' + rowId);
            // make sure we retrieved the rowId
            if (rowId !== null && rowId !== undefined) {
                // we'll pass null as the relative path to use the default file
                control.openDetailView(tableId, rowId, null);
            }
        });
    }
    
    return (function() {
        displayGroup(idxStart);
    }());
};


/**
 * Displays the list view in chunks or groups. Number of list entries per chunk
 * can be modified. The list view is designed so that each row in the table is
 * represented as a list item. If you touch a particular list item, it will
 * expand with more details (that you choose to include). Clicking on this
 * expanded portion will take you to the more detailed view.
*/
var displayGroup = function(idxStart) {
    console.log('display group called. idxStart: ' + idxStart);
    /* Number of rows displayed per 'chunk' - can modify this value */
    var chunk = 50;
    for (var i = idxStart; i < idxStart + chunk; i++) {
        if (i >= uniqueSensorIds.length) {
            break;
        }
        // Now need to map the uniqueSensorIds to rowId
        var rowId = uniqueSensorIdToRowIdMap[uniqueSensorIds[i]];

        /* Creates the item space */
        // We're going to select the ul and then start adding things to it.
        var item = $('<li>');
        item.attr('rowId', data.getRowId(rowId));
        item.attr('class', 'item_space');
        item.text(data.getData(rowId, 'sensorid'));
                
        /* Creates arrow icon (Nothing to edit here) */
        var chevron = $('<img>');
        chevron.attr('src', '../../../assets/img/little_arrow.png');
        chevron.attr('class', 'chevron');
        item.append(chevron);
                
        /**
         * Adds other data/details in item space.
         * Replace COLUMN_NAME with the column whose data you want to display
         * as an extra detail etc. Duplicate the following block of code for
         * different details you want to add. You may replace occurrences of
         * 'field1' with new, specific label that are more meaningful to you
         */
        var field1 = $('<li>');
        var sensorType = data.getData(rowId, 'sensortype');
        field1.attr('class', 'detail');
        field1.text('Sensor Type: ' + sensorType);
        item.append(field1);

        var field2 = $('<li>');
        var msgType = data.getData(rowId, 'msgtype');
        field2.attr('class', 'detail');
        field2.text('Sensor Message Type: ' + msgType);
        item.append(field2);

        $('#list').append(item);
    }
    if (i < uniqueSensorIds.length) {
        setTimeout(resumeFn, 0, i);
    }

};
