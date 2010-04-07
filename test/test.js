//  Types
//
//  - number
//  
//  Plugin
//  
//  - Creates an instance
//  - Calls method with argument
//  - Sets options
//  - Returns jQuery

QUnit.testStart = function() {
  
  table = '                                          \
    <table class="editable">                         \
      <thead>                                        \
        <tr>                                         \
          <th class="type-text name-name">Name</th>  \
        </tr>                                        \
      </thead>                                       \
      <tbody>                                        \
        <tr>                                         \
          <td>Wooster, Bertram</td>                  \
        </tr>                                        \
        <tr>                                         \
          <td>Jeeves, Reginald</td>                  \
        </tr>                                        \
      </tbody>                                       \
    </table>\
  ';
  
  inst = $.livetable.create(table);
};
  
module('Singleton');

test('addType', function(){
  var func1 = function() { return 1; };
  var func2 = function() { return 2; };
  
  equals($.livetable.addType(), false, 'return false if name is not a string');
  equals($.livetable.addType('test'), true, 'return true if name is a string');
  equals($.livetable.addType('test2', func1, func2), true, 'return true if a valid name and two functions are passed');
  
  var saved1    = $.livetable.types['test'];
  var saved2    = $.livetable.types['test2'];
  var expected1 = {toField: $.livetable.defaultOptionsToField, toText: $.livetable.defaultOptionsToText};
  var expected2 = {toField: func1, toText: func2};    
  
  ok(saved1, 'add first type to types object');
  ok(saved2, 'add second type to types object');
  same(expected1, saved1, 'toField and toText properities should be default functions if no functions were passed');
  same(expected2, saved2, 'toField and toText properities should be functions if functions were passed');
});

test('removeType', function(){
  $.livetable.addType('test');
  
  var expected = $.livetable.types['test'];
  var result = $.livetable.removeType('test');
  
  equals(undefined, $.livetable.types['test'], 'remove a type');
  same(expected, result, 'return the type object it removes');
  equals(false, $.livetable.removeType('ozymandias'), 'return null when removing a non-existent type');
});

test('hasType', function(){
  $.livetable.addType('test');
  equals(true, $.livetable.hasType('test'), 'return true when type exists');
  equals(false, $.livetable.hasType('wondermark'), 'return false when type does not exist');
});

test('collect', function(){
  var td = $('<td data-foo="bar" class="baz-qux some-other-class nodasheshere">');
  var result = {foo: 'bar', baz: 'qux', some: 'other-class'};
  same($.livetable.collect(td), result);
});

test('column', function(){
  var table = $('               \
    <table>                     \
      <tr>                      \
        <td>0</td>              \
        <td>1</td>              \
        <td>2</td>              \
      </tr>                     \
      <tr>                      \
        <td colspan="2">0</td>  \
        <td>2</td>              \
      </tr>                     \
    </table>\
  ');
  
  var first   = table.find('td').eq(0);
  var second  = table.find('td').eq(1);
  var third   = table.find('td').eq(2);
  var colspan = table.find('[colspan]');
  var last    = table.find('td:last');
  
  equals(0, $.livetable.column(first),   'first <td> should have an index of 0');
  equals(1, $.livetable.column(second),  'second <td> should have an index of 1');
  equals(2, $.livetable.column(third),   'third <td> should have an index of 2');
  equals(0, $.livetable.column(colspan), '<td> with colspan should have an index of 0');
  equals(2, $.livetable.column(last),    'last <td> should have an index of 2');
});

test('data', function(){
  var table = $('                             \
    <table>                                   \
      <thead>                                 \
        <tr>                                  \
          <th class="type-foo name-baz other-hello"></th> \
        </tr>                                 \
      </thead>                                \
      <tbody>                                 \
        <tr>                                  \
          <td class="type-bar name-biz other-goodbye"></td> \
        </tr>                                 \
        <tr>                                  \
          <td></td>                           \
        </tr>                                 \
      </tbody>                                \
    </table>\
  ');
  
  var td   = table.find('td:last');
  var td2  = table.find('tbody tr:first td');
  var expected = {column: 0, type: 'foo', name: 'baz', other: 'hello'};
  
  same($.livetable.data(td), expected, 'finds type, name, column index, and other from first <th> in the column');
  
  table.find('thead').remove();
  expected.type = 'bar';
  expected.name = 'biz';
  expected.other = 'goodbye';
  
  same($.livetable.data(td),  expected, 'finds type, name, column index, and other from first <td> in the column');
  same($.livetable.data(td2), expected,  'correct data is found even when a <td> from the first row is passed');
  same($.livetable.data(td2.clone()), expected, 'correct data is found even when there is no target');
  
  table.find('td:first').removeClass('name-biz');
  expected.name = 'bar0';
  
  same($.livetable.data(td), expected, 'if name is not found, combine the type with the column index');
});

test('transformRow', function(){
  var row = $('                          \
    <tr>                                 \
      <td>Able</td>                      \
      <td class="type-none">Baker</td>   \
      <td class="type-text">Charlie</td> \
    </tr>\
  ');
  
  
  var tds = row.find('td');
  var field_row = $.livetable.transformRow(row.clone(), 'fields');
  var field_tds = field_row.find('td');
  
  var text_row  = $.livetable.transformRow(field_row.clone(), 'text');
  var text_tds  = text_row.find('td');
  
  var toField  = $.livetable.types.text.toField;
  var data     = $.livetable.data(tds.eq(2));
  var expected = toField(data, null, tds.eq(2));
  expected     = $('<td></td>').append(expected).html();
  
  same(field_tds.eq(0).html(), tds.eq(0).html(), '<td> with no type should be ignored');
  same(field_tds.eq(1).html(), tds.eq(1).html(), '<td> with invalid type should be ignored');
  same(field_tds.eq(2).html(), expected,         'transform a row to fields');
  same(text_tds.eq(2).html(),  tds.eq(2).html(), 'transform a row to text');
});

test('create', function(){
  var table = $('<table></table>');
  var not_a_table = $('<div></div>');
  
  equals(false, $.livetable.create(not_a_table), 'return false when passed non-table element');
  var expected = $.livetable.create(table);
  
  same(expected, table.data($.livetable.name), 'create an instance of $.livetable._class and store it in the table');
});

test('get', function(){
  var table    = $('<table></table>');
  var expected = $.livetable.create(table);
  same(expected, $.livetable.get(table), 'get a $.livetable._class instance stored in a table');
  same(false, $.livetable.get($('<table></table>')), 'return false when no instance found');
});

test('formatNumber', function(){
  equal($.livetable.formatNumber(), false, 'return false when no arguments supplied');
  equal($.livetable.formatNumber('hellothere'), false, 'return false when no number supplied');
  equal($.livetable.formatNumber('123.45'), 123.45, 'use parseFloat() when possible');
  equal($.livetable.formatNumber(1234), '1,234');
  equal($.livetable.formatNumber(123), '123');
  equal($.livetable.formatNumber(12345.6789, {places: 2}), '12,345.68');
  equal($.livetable.formatNumber(12345.6, {places: '2'}), '12,345.60');
  equal($.livetable.formatNumber(12345, {places: 2, separator: null}), '12345.00');
  equal($.livetable.formatNumber(12345, {places: 4, separator: ' '}), '12 345.0000');
  equal($.livetable.formatNumber(112345678901, {}), '112,345,678,901');
  equal($.livetable.formatNumber(112345678901.12), '112,345,678,901.12');
  equal($.livetable.formatNumber(1234.74, {places: null, separator: null, decimal: ','}), '1234,74');
  equal($.livetable.formatNumber(-1234.56), '-1,234.56');
  equal($.livetable.formatNumber(-1234.56, {negative: '(%n)'}), '(1,234.56)');
  equal($.livetable.formatNumber(-1234.56, {negative: '%n-'}), '1,234.56-');
  equal($.livetable.formatNumber(-1234.56, {negative: '(%c%n)', currency: '$'}), '($1,234.56)');
  equal($.livetable.formatNumber(1234.56, {currency: '$', positive: '%c %n'}), '$ 1,234.56');
  equal($.livetable.formatNumber(123, {currency: '$'}), '$123');
  equal($.livetable.formatNumber(-123, {currency: '$'}), '-$123');
});

test('parseNumber', function(){
  equal($.livetable.parseNumber(), false, 'return false when no arguments supplied');
  equal($.livetable.parseNumber('1,234.56'), 1234.56);
  equal($.livetable.parseNumber('1,234.56foo'), 1234.56);
  equal($.livetable.parseNumber('foo1,234.56foo'), 1234.56);
  equal($.livetable.parseNumber('1 234,56', ','), 1234.56);
  equal($.livetable.parseNumber('-1 234,56', ','), -1234.56);
  equal($.livetable.parseNumber('(1 234,56)', ',', '(%n)'), -1234.56);
  equal($.livetable.parseNumber('foo(1 234,56)', ',', '(%n)'), -1234.56);
  equal($.livetable.parseNumber('1,234.56-', '.', '%n-'), -1234.56);
  equal($.livetable.parseNumber('foo1,234.56-foo', '.', '%n-'), -1234.56);
});

module('Instance');

test('instantiate', function(){
  var options = $.extend({}, $.livetable.default_options, {selectedClass: 'greetings'});
  
  inst      = $.livetable.create(table, options);
  var inst2 = $.livetable.create(table);
  
  same(options, inst.options, 'save options');
  same($.livetable.default_options, inst2.options, 'use default options');
  notDeepEqual(inst.options, inst2.options, 'default options are not equal to custom options');
});

test('disable', function(){
  inst.disable();
  equals(true, inst.disabled, 'set disabled to true');
  inst.disabled = false;
});

test('isDisabled', function(){
  inst.disable();
  equals(true, inst.isDisabled(), 'return true when disabled');
  inst.enable();
  equals(false, inst.isDisabled(), 'return false when enabled');
});

test('enable', function(){
  inst.disable();
  inst.enable();
  equals(false, inst.isDisabled(), 'sets disabled to false');
});

test('destroy', function(){
  var livetable_events = false;
  var other_events     = false;
  
  inst.table.find('td').click(function(){});
  inst.destroy();
  
  $('*').add(inst.table).find('*').each(function(){
    var events = $(this).data('events') || {};
    
    $.each(events, function(){
      $.each(this, function(){
        if (this.type && this.type == inst.name) {
          livetable_events = true;
        } else {
          other_events = true;
        }
      });
    });
  });
  
  equals(false,     livetable_events, 'should clear all livetable-related events');
  equals(true,      other_events,     'should leave other events intact');
  equals(undefined, inst.table.data($.livetable.name), 'should remove the livetable data key');
});

test('select', function(){
  var selected_class = '.' + inst.options.selectedClass;
  var row1 = inst.table.find('tbody tr:first');
  var row2 = inst.table.find('tbody tr:eq(1)');
  
  inst.select(row1);
  
  equals(row1.is(selected_class), true, 'has selected class');
  equals(inst.select(row1), false, 'return false when row is already selected');
  equals(inst.select('<div></div>'), null, 'return null when no row is found');
   
  inst.select(row2);
  
  equals(row2.is(selected_class), true,  'select another row');
  equals(row1.is(selected_class), false, 'deselects other selected rows');
  
  inst.options.beforeDeselect = function() {
    return false;
  };
  
  equals(inst.select(row1), false, 'returns false if deselecting returns false');
  
  delete inst.options.beforeDeselect;
  
  inst.options.beforeSelect = function() {
    return false;
  };
  
  equals(inst.select(row1), false, 'returns false if beforeSelect returns false');
  
  delete inst.options.beforeSelect;
  
  var event_passed;
  inst.options.beforeDeselect = function(row, event) {
    event_passed = event;
    return true;
  };
  
  inst.select(row1);
  row2.click();
  
  ok(event_passed, 'passes event when automatically deselecting current row');
  
});

test('deselect', function(){
  var selected_class = '.' + inst.options.selectedClass;
  var row1 = inst.table.find('tbody tr:first');
  
  inst.select(row1);
  
  equals(true, row1.is(selected_class), 'select row');
  
  inst.deselect(row1);
  
  equals(false, row1.is(selected_class), 'deselect row');
  equals(null, inst.deselect('<div></div>'), 'return null if row not found');
  
  inst.options.beforeDeselect = function() {
    return false;
  };
  
  equals(false, inst.deselect(row1), 'return false if beforeDeselect returns false');
  
  delete inst.options.beforeDeselect;
  
  inst.select(row1);
  
  row1.find(':input').val('foo!');
  
  inst.options.beforeDiscardChanges = function() {
    return false;
  };
  
  equals(false, inst.deselect(row1), 'return false if beforeDiscardChanges returns false');
});

test('option', function(){
  equals(inst.options.selectedClass, inst.option('selectedClass'), 'return option value');
  
  inst.option('economist', 'mises');
  equals(inst.options.economist, 'mises', 'sets option value');
  
  inst.disable();
  equals('mises', inst.option('economist', 'keynes'), 'return option value when disabled');
  equals(inst.options.economist, 'mises', 'does not set option when disabled');
});

test('save', function(){
  inst.select(inst.table.find('tbody tr:first'));
  
  inst.disable();
  equals(null, inst.save(), 'return null when disabled');
  inst.enable();
  same(inst._remember('save'), inst.save(), "return result of _remember('save')");
});

test('restore', function(){
  inst.select(inst.table.find('tbody tr:first'));
  
  inst.disable();
  equals(null, inst.restore(), 'return null when disabled');
  inst.enable();
  same(inst._remember('restore'), inst.restore(), "return result of _remember('restore')");
});

test('hasChanges', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.select(tr);
  
  tr.find(':input').val('boo!');
  var expected = inst._remember('hasChanges');
  
  same(expected, inst.hasChanges(), "return result of _remember('hasChanges')");
  inst.disable();
  same(expected, inst.hasChanges(), 'work when disabled');
});

test('changes', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.select(tr);
  
  tr.find(':input').val('boo!');
  var expected = inst._remember('changes');
  
  same(expected, inst.changes(), "return result of _remember('changes')");
  inst.disable();
  same(expected, inst.changes(), 'work when disabled');
});

test('serialize', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.select(tr);
  
  var expected     = inst._remember('serialize');
  var expected_obj = inst._remember('serialize', true);
  
  same(inst.serialize(), expected, "return result of _remember('serialize')");
  same(inst.serialize(true), expected_obj, "return result of _remember('serialize', true)");
  
  inst.disable();
  same(inst.serialize(), expected, 'work when disabled');
  same(inst.serialize(true), expected_obj, 'work when disabled');
});

test('last', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.select(tr);
  
  var expected     = inst._remember('last');
  var expected_obj = inst._remember('last', true);

  same(inst.last(), expected, "return result of _remember('last')");
  same(inst.last(true), expected_obj, "return result of _remember('last', true)");

  inst.disable();
  same(inst.last(), expected, 'work when disabled');
  same(inst.last(true), expected_obj, 'work when disabled');
});

test('_trigger', function(){
   inst.options.someCallback = function(arg) {
     return arg;
   };
   
   var arg = 'water buffalo';
   
   equal(arg, inst._trigger('someCallback', arg), 'calls function in options with arguments');
   equal(null, inst._trigger('idontexist'), 'return null when callback not found');
});

test('_currentRow', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.select(tr);
  
  tr = inst.table.find('.selected');
  equal(tr.html(), inst._currentRow().html(), 'return currently selected row');
  
  inst.deselect();
  equal(null, inst._currentRow(), 'return null when not found');
});

test('_findRow', function(){
  thead_row = inst.table.find('thead tr');
  equal(null, inst._findRow(thead_row), 'return null when row is inside of thead');
  equal(null, inst._findRow('<tr><td>Hi</td></tr>'), 'return null when row is not inside of table');
  
  var td = inst.table.find('td:first');
  var tr = inst.table.find('tbody tr:first');
  equal(tr.html(), inst._findRow(td).html(), 'return <tr> inside of table');
  equal(tr.html(), inst._findRow(tr).html(), 'return <tr> when <tr> passed');
});

test('_setupEvents', function(){
  var tr = inst.table.find('tbody tr:first');
  inst.table.find('*').add('body').unbind('.' + inst.name);
  
  tr.click();
  equal(inst._currentRow(), null, 'before calling _setupEvents(), clicking the row does not select it');
  
  inst._setupEvents();
  
  tr.click();
  ok(inst._currentRow(), 'after calling _setupEvents() clicking the row selects it');
  
  $('body').click();
  equal(inst._currentRow(), null, 'clicking the body deselects the row');
  
  tr.find('td:first').append('<b>Hello</b>');
  $('body').append(inst.table);
  tr.find('b').click();
  
  ok(inst._currentRow(), 'clicking on an element inside a td selects the row');
  inst.table.remove();
});

test('_remember', function(){
  $.fn.remember_old = $.fn.remember;
  delete $.fn.remember;
  
  var error;
  try {
    inst._remember('foo');
  } catch (e) {
    error = e;
  }
  
  ok(error, 'Throw error when $.remember plugin not being used');
  
  $.fn.remember = function(arg1, arg2) {
    return arg1 + arg2;
  };
  
  equal(inst._remember(), false, 'return false when there is no current row');
  
  inst.select(inst.table.find('tbody tr:first'));
  equal(inst._remember('hel', 'lo'), 'hello', 'call $.fn.remember(); when there is a current row');
  
  $.fn.remember = $.fn.remember_old;
  delete $.fn.remember_old;
});

module('Types');

test('text', function(){
  var type = 'text';
  var name = 'diogenes';
  var data = {name: name};
  var td   = $('<td></td>').text(name);
  var input = $.livetable.types[type].toField(data, null, td);
  
  equal(input.get(0).nodeName.toLowerCase(), 'input', 'return an input field');
  equal(input.attr('name'), name, 'sets correct name');
  equal(input.attr('id'), name, 'sets correct id');
  equal(input.val(), name, 'sets correct value');
  
  var text = $.livetable.types[type].toText(data, input, td);
  
  equal(text, name, 'toText() should return value of input field');
});

test('textarea', function(){
  var type = 'textarea';
  var name = 'rachmaninoff';
  var data = {name: name};
  var td   = $('<td></td>').text(name);
  var input = $.livetable.types[type].toField(data, null, td);
  
  equal(input.get(0).nodeName.toLowerCase(), 'textarea', 'return a textarea');
  equal(input.attr('name'), name, 'sets correct name');
  equal(input.attr('id'), name, 'sets correct id');
  equal(input.val(), name, 'sets correct value');
  equal(input.text(), name, 'sets correct text');
  
  var text = $.livetable.types[type].toText(data, input, td);
  equal(text, name, 'toText() should return value of textarea');
});

test('number', function(){
  var type = 'number';
  var name = 'babbage';
  var val  = '(1 000,31)';
  var td   = $('<td></td>').text(val);
  var data = {
    name: name,
    places: 2,
    separator: ' ',
    decimal: ',',
    negative: '(%n)'
  };
  
  var default_input = $.livetable.defaultOptionsToField(data, null, td);
  var input = $.livetable.types[type].toField(data, default_input, td);
  
  equal(input.get(0).nodeName.toLowerCase(), 'input', 'return an input field');
  equal(input.attr('name'), name, 'sets correct name');
  equal(input.attr('id'), name, 'sets correct id');
  equal(input.val(), '-1000.31', 'sets correct value');
  
  td.append(input);
  input.val(input.val() + '123'); // Add decimals to check places limiting
  var text = $.livetable.types[type].toText(data, input, td);
  equal(text, val, 'toText() should return formatted number value of input field');
});

test('checkbox', function(){
  var type = 'checkbox';
  var name = 'babbage';
  var val  = 'Yes';
  var td   = $('<td></td>').text(val);
  var data = {
    name: name,
    on: 'Yes',
    off: 'No'
  };
  
  var default_input = $.livetable.defaultOptionsToField(data, null, td);
  var input = $.livetable.types[type].toField(data, default_input, td);
  
  equal(input.get(0).nodeName.toLowerCase(), 'input', 'return an input field');
  equal(input.attr('type'), 'checkbox', 'is checkbox');
  equal(input.attr('name'), name, 'sets correct name');
  equal(input.attr('id'), name, 'sets correct id');
  equal(input.attr('checked'), true, 'sets correct value');
  
  td.empty().append(input);
  
  var text = $.livetable.types[type].toText(data, input, td);
  equal(text, val, 'toText() returns correct value');
  
  input.attr('checked', false);
  
  text = $.livetable.types[type].toText(data, input, td);
  equal(text, data.off, 'toText() returns correct value');
});