//  $.livetable
//  
//  - addType
//  - removeType
//  - hasType
//  - data
//  - columnData
//  - column
//  - transformRow
//  - rowToText
//  - rowToFields
//  - _key
//  - _create
//  - _get
//  
//  Livetable
//  
//  - disable
//  - enable
//  - isDisabled
//  - destroy
//  - select
//  - deselect
//  - option
//  - save
//  - restore
//  - hasChanges
//  - changes
//  - serialize
//  - last
//  - _trigger
//  - _currentRow
//  - _findRow
//  - _setupEvents
//  - _remember
//  
//  Types
//  
//  - text
//  - textarea
//  - number
//  
//  Plugin
//  
//  - Creates an instance
//  - Calls method with argument
//  - Sets options
//  - Returns jQuery

$(document).ready(function(){
  var table = $('table');
  
  module('Basic requirements');
  
  test('$.fn.livetable()', function(){
    equals('function', typeof($.fn.livetable), 'is a function');
    $('table').livetable();
  });

  test('disable', function(){
    var value = table.livetable('disable');
    equals(table, value, 'should return jQuery object');
  });
  
  test('isDisabled', function(){
    table.livetable('disable');
    equals(true, table.livetable('isDisabled'), 'should return true when disabled');
    table.livetable('enable');
    equals(false, table.livetable('isDisabled'), 'should return false when enabled');
  });

  test('enable', function(){
    var value = table.livetable('enable');
    equals(table, value, 'should return jQuery object');
  });

  test('destroy', function(){
    var value = table.livetable('destroy');
    equals(table, value, 'should return jQuery object');
    
    // should remove associated data
    // should unbind associated events
    
    table.livetable();
  });
});