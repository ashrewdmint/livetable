//  $.livetable
//
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
  
  
  module('$.livetable');
  
  test('addType', function(){
    var func1 = function() { return 1; };
    var func2 = function() { return 2; };
    
    equals(false, $.livetable.addType(), 'return false if name is not a string');
    equals(true,  $.livetable.addType('test'), 'return true if name is a string');
    equals(true,  $.livetable.addType('test2', func1, func2), 'return true if a valid name and two functions are passed');
    
    var saved1    = $.livetable._types['test'];
    var saved2    = $.livetable._types['test2'];
    var expected1 = {to_field: null, to_text: null};
    var expected2 = {to_field: func1, to_text: func2};    
    
    ok(saved1, 'add first type to _types object');
    ok(saved2, 'add second type to _types object');
    same(expected1, saved1, 'to_field and to_text properities should be null if no functions were passed');
    same(expected2, saved2, 'to_field and to_text properities should be functions if functions were passed');
  });
  
  test('removeType', function(){
    equals(null, $.livetable.removeType('ozymandias'), 'return null when removing a non-existent type');
    $.livetable.addType('test');
    var expected = $.livetable._types['test'];
    same(expected, $.livetable.removeType('test'), 'return the type object it removes');
    equals(undefined, $.livetable._types['test'], 'remove a type');
  });
  
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