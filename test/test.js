//  Livetable
//  
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
  
  equals(false, $.livetable.addType(), 'return false if name is not a string');
  equals(true,  $.livetable.addType('test'), 'return true if name is a string');
  equals(true,  $.livetable.addType('test2', func1, func2), 'return true if a valid name and two functions are passed');
  
  var saved1    = $.livetable.types['test'];
  var saved2    = $.livetable.types['test2'];
  var expected1 = {to_field: $.livetable.default_options_to_field, to_text: $.livetable.default_options_to_text};
  var expected2 = {to_field: func1, to_text: func2};    
  
  ok(saved1, 'add first type to types object');
  ok(saved2, 'add second type to types object');
  same(expected1, saved1, 'to_field and to_text properities should be default functions if no functions were passed');
  same(expected2, saved2, 'to_field and to_text properities should be functions if functions were passed');
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

test('data', function(){
  var el = $('<div></div>');
  var el_class = el.clone().addClass('moose-bullwinkle');
  var el_attr  = el.clone().attr('data-squirrel', 'rocky');
  
  equals('bullwinkle', $.livetable.data(el_class, 'moose'), 'should find data in classes');
  equals('rocky', $.livetable.data(el_attr, 'squirrel'), 'should find data in HTML5 data attributes');
  equals(null, $.livetable.data(el, 'foo'), 'should return null if no data found');
  equals(false, $.livetable.data(el), 'should return false if no name argument was passed');
  equals(false, $.livetable.data(), 'should return false if no element argument was passed');
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

test('columnData', function(){
  var table = $('                             \
    <table>                                   \
      <thead>                                 \
        <tr>                                  \
          <th class="type-foo name-baz"></th> \
        </tr>                                 \
      </thead>                                \
      <tbody>                                 \
        <tr>                                  \
          <td class="type-bar name-biz"></td> \
        </tr>                                 \
        <tr>                                  \
          <td></td>                           \
        </tr>                                 \
      </tbody>                                \
    </table>\
  ');
  
  var td       = table.find('td:last');
  var expected = {column: 0, type: 'foo', name: 'baz'};
  
  same(expected, $.livetable.columnData(td), 'finds type, name, and column index from first <th> in the column');
  
  table.find('thead').remove();
  expected.type = 'bar';
  expected.name = 'biz';
  
  same(expected, $.livetable.columnData(td), 'finds type, name, and column index from first <td> in the column');
  
  td.addClass('type-qux name-tux');
  expected.type = 'qux';
  expected.name = 'tux';
  
  same(expected, $.livetable.columnData(td), 'finds type, name, and column index from passed <td> if it has them');
  
  td.removeClass('name-tux');
  table.find('td:first').attr('class', '');
  expected.name = 'qux-0';
  
  same(expected, $.livetable.columnData(td), 'if name is not found, combine the type with the column index');
  
  table.find('td').attr('class', '');
  expected.name = null;
  expected.type = null;
  
  same(expected, $.livetable.columnData(td), 'if no name or type is found, those properties should be null');
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
  
  var to_field = $.livetable.types.text.to_field;
  var data     = $.livetable.columnData(tds.eq(2));
  var expected = to_field(data, tds.eq(2));
  expected = $('<td></td>').append(expected).html();
  
  same(tds.eq(0).html(), field_tds.eq(0).html(), '<td> with no type should be ignored');
  same(tds.eq(1).html(), field_tds.eq(1).html(), '<td> with invalid type should be ignored');
  same(expected,         field_tds.eq(2).html(), 'transform a row to fields');
  same(tds.eq(2).html(), text_tds.eq(2).html(),  'transform a row to text');
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
  
  equals(true,  row1.is(selected_class),    'has selected class');
  equals(false, inst.select(row1),          'return false when row is already selected');
  equals(null,  inst.select('<div></div>'), 'return null when no row is found');
  
  inst.select(row2);
  
  equals(true,  row2.is(selected_class), 'select another row');
  equals(false, row1.is(selected_class), 'deselects other selected rows');
  
  inst.options.beforeDeselect = function() {
    return false;
  };
  
  equals(false, inst.select(row1), 'returns false if deslecting returns false');
  
  delete inst.options.beforeDeselect;
  
  inst.options.beforeSelect = function() {
    return false;
  };
  
  equals(false, inst.select(row1), 'returns false if beforeSelect returns false');
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
  equal(null, inst._currentRow(), 'before calling _setupEvents(), clicking the row does not select it');
  
  inst._setupEvents();
  
  tr.click();
  ok(inst._currentRow(), 'after calling _setupEvents() clicking the row selects it');
  
  $('body').click();
  equal(null, inst._currentRow(), 'clicking the body deselects the row');
});