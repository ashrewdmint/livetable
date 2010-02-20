//  Livetable
//  
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
  
  var table = '                                      \
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
  
  var inst = $.livetable.create(table);

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
});