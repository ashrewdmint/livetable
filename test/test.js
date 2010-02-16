$(document).ready(function(){
  var table = $('table');
  
  module('Basic requirements');
  
  test('$.fn.livetable()', function(){
    equal('function', typeof($.fn.livetable));
    $('table').livetable();
  });

  test('disable', function(){
    var value = table.livetable('disable');
    equal(table, value, 'should return jQuery object');
  });
  
  test('isDisabled', function(){
    table.livetable('disable');
    equals(true, table.livetable('isDisabled'), 'should return true when disabled');
    table.livetable('enable');
    equals(false, table.livetable('isDisabled'), 'should return false when enabled');
  });

  test('enable', function(){
    var value = table.livetable('enable');
    equal(table, value, 'should return jQuery object');
  });

  test('destroy', function(){
    var value = table.livetable('destroy');
    equal(table, value, 'should return jQuery object');
    
    // should remove associated data
    // should unbind associated events
    
    table.livetable();
  });
});