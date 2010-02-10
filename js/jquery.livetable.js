/*
 * Livetable - jQuery plugin
 * Dynamically edit HTML tables
 *
 * Copyright (c) 2010 Andrew Smith
 * Examples and documentation at: http://github.com/ashrewdmint/livetable
 * 
 * Version: 0.0.0 (date)
 * Requires: jQuery v1.3+
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($){

  var NAME         = 'livetable';
  var DEFAULT_TYPE = 'text';
  
  // $.livetable

  $.livetable = {
    _types:          {},
    _keys:           [NAME],
    _default:        {rememberChanges: true, selectedClass: 'selected'},
    _methods:        ['destroy', 'disable', 'enable', 'isDisabled', 'serialize', 'select', 'deselect', 'hasChanges', 'changes', 'reset'],
    _return_methods: ['isDisabled', 'serialize', 'hasChanges', 'changes'],
    _events:         ['onSelect', 'beforeSelect', 'onDeselect', 'beforeDeselect', 'onSerialize', 'beforeDiscardChanges'],
    
    // Adds a new type.
    // Name must be a string, to_field and to_text must be functions
    // If functions are not supplied, defaults will be used.
  
    addType: function(name, to_field, to_text) {
      if (typeof(name) == 'string') {
        to_field = typeof(to_field) == 'function' ? to_field : null;
        to_text  = typeof(to_text)  == 'function' ? to_text  : null;
        
        this._types[name] = {to_field: to_field, to_text: to_text};
        return true;
      }
      return false;
    },
    
    // Removes a type and returns the type's two functions.
    
    removeType: function(name) {
      var method = this._types[name];
      delete this._types[name];
      return method;
    },
    
    // Returns true if name is a type, false if otherwise.
    
    hasType: function(name) {
      return typeof(this._types[name]) != 'undefined';
    },
    
    // Looks for data set on an element in data attributes or classes.
    // Returns data value, or null if nothing was found.
    
    data: function(el, name) {
      var value, attr_value, regex, match;
      el = $(el);
      
      // Look in classes
      regex = new RegExp(name + '-([^ ]+)');
      match = el.attr('class').match(regex);
      
      if (match && typeof(match[1]) == 'string') {
        value = match[1];
      } else {
        value = null;
      }
      
      // Look in attributes
      if (! value) {
        attr_value = el.attr('data-' + name);
        if (typeof(attr_value) == 'string' && attr_value !== '') {
          value = attr_value;
        }
      }
      
      return value;
    },
    
    // Uses data() to find a <td>'s name and type. Attempts to find missing
    // data by traversing up the associated column and looking in the first
    // <th> or the first <td>. If no name is found, type will be used. If no
    // type is found, "text" will be used.
    
    columnData: function(td) {
      var self = this, data = {}, value, column, tdh;
      
      td = $(td);
      column = this.column(td);
      
      $.each(['type', 'name'], function(index, key) {
        
        // Look in <td>
        value = self.data(td, key);
        
        // Traverse up column and look in <td> or <th>
        if (! value) {
          tdh = td.parents('table:first')
            .find('tr:first')
            .children()
            .eq(column);
          
          value = self.data(tdh, key);
        }
        
        data[key] = value;
      });

      // Set column
      data.column = self.column(td);
      
      // Use defaults
      if (! data.type || data.type == 'none') {
        data.type = null;
      }
      
      if (! data.name) {
        data.name = data.type + '-' + data.column;
      }
      
      return data;
    },
    
    // Finds the column number of a <td>. Takes colspan into account.
    // First column is 0, second is 1, etc.
    
    column: function(td) {
      var position = 0, increase, colspan;
      
      $(td).prevAll().each(function() {
        colspan = parseInt($(this).attr('colspan'), 10);
        increase = colspan > 0 ? colspan : 1;
        position += increase;
      });
      
      return position;
    },
    
    // Transforms a row

    transformRow: function(row, form) {
      var self = this, oldhtml = this._key('oldhtml'), td, data, type, input, result;
      
      $(row).children('td').each(function() {
        td = $(this);
        data = $.livetable.columnData(td);
        
        // Default input
        input = $('<input />').attr({
          type: 'text',
          name:  data.name,
          id:    data.name,
          value: td.text()
        });
        
        if (! data.type) {
          return;
        }
        
        if (self.hasType(data.type)) {  
          type = self._types[data.type];
          
          if (form == 'fields') {
            td.data(oldhtml, td.html());
            
            if (type.to_field) {
              result = type.to_field(data, td, input);
            }
            // Default
            else {
              result = input;
            }
          }
          if (form == 'text') {
            if (type.to_text) {
              result = type.to_text(data, td, td.data(oldhtml));
            }
            // Default
            else {
              result = td.find(':input').val();
            }
          }
        } else {
          throw 'Livetable: invalid type "' + data.type + '"';
        }
        
        td.html(result);
      });
    },

    // Converts a row's fields to text

    rowToText: function(row) {
      return this.transformRow(row, 'text');
    },

    // Converts a row to fields

    rowToFields: function(row) {
      return this.transformRow(row, 'fields');
    },
    
    _key: function(name) {
      name = NAME + '.' + name;
      this._keys.push(name);
      return name;
    },
    
    // Creates a new instance of Livetable and stores it in a table element.
    
    _create: function(table, options) {
      table = $(table);
      table.data(NAME, new Livetable(table, options));
    },
    
    // Get an instance of Livetable stored in a table element.
    // Returns false if no instance found.
    
    _get: function(table) {
      table = $(table);
      if (typeof(table.data(NAME)) == 'object') {
        return table.data(NAME);
      }
      return false;
    }
  };
  
  // Livetable
  
  function Livetable(table, options) {
    this.table     = $(table);
    this.disabled  = false;
    this.options   = $.extend($.livetable._default, options);
    this.id        = Math.ceil(Math.random() * 10 * 1000000);
    this.namespace = '.' + NAME + '.' + this.id;
    this._setupEvents();
  }
  
  $.extend(Livetable.prototype, {
    disable: function() {
      this.disabled = true;
    },
    
    enable: function() {
      this.disabled = false;
    },
    
    isDisabled: function() {
      return this.disabled;
    },
    
    destroy: function() {
      var self = this;
      this.deselect();
      
      // Remove all associated data
      this.table.find('*').andSelf().each(function(index, el){
        $.each($.livetable._keys, function(i, key){
          $(el).removeData(key);
        });
      });
      
      // Unbined all events associated with this instance
      $('*').unbind(this.namespace);
    },
    
    select: function(row, event) {
      if (this.disabled) {
        return null;
      }
      row = this._findRow(row);
      if (row) {
        // If the row is not already selected, and deselecting other
        // rows doesn't return false, and the beforeSelect callback
        // doesn't return false.
        
        if (! row.is('.' + this.options.selectedClass) && this.deselect() !== false && this._trigger('beforeSelect', row, event) !== false) {  
          row.addClass(this.options.selectedClass);
          
          $.livetable.rowToFields(row);
          
          // Use remember plugin if it exists
          if ($.fn.remember && this.options.rememberChanges) {
            row.remember();
          }
          
          this._trigger('onSelect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    deselect: function(row, event) {
      if (this.disabled) {
        return null;
      }
      
      if (row) {
        row = this._findRow(row);
      } else {
        row = this._currentRow(row);
      }
      
      if (row) {
        if (this._trigger('beforeDeselect', row, event) !== false) {
          row.removeClass(this.options.selectedClass);
          $.livetable.rowToText(row);
          this._trigger('onDeselect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    option: function(name, value) {
      if (typeof(value) == 'undefined') {
        return this.options[name];
      }
      this.options[name] = value;
      return value;
    },
    
    // Triggers an event callback. Returns result of callback, if callback
    // was found. Returns null otherwise.
    
    _trigger: function() {
      arguments = $.makeArray(arguments);
      var callback = this.options[arguments[0]];
      arguments.shift();
      
      if (typeof(callback) == 'function') {
        return callback.apply(callback, arguments);
      }
      return null;
    },
    
    // Finds the currently selected row
    
    _currentRow: function() {
      return this._findRow(this.table.find('.' + this.options.selectedClass));
    },
    
    // Ensures an element is a <tr> inside of the correct <table>
    
    _findRow: function(row) {
      var inside_table = false, self = this;
      row = $(row);

      if (! row.is('tr')) {
        row = row.parents('tr:first');
      }
      
      row.parents('table').each(function(){
        if ($(this)[0] == self.table[0]) {
          inside_table = true;
        }
      });
      
      if (row.length && inside_table) {
        return row;
      }
      return false;
    },
    
    _setupEvents: function() {
      var self = this;
      
      // Select
      this.table.find('tr').bind('click' + this.namespace, function(event) {
        self.select(event.target, event);
      });
      
      // Deselect
      $('body').bind('click' + this.namespace, function(event) {
        if (! self._findRow(event.target)) {
          self.deselect(null, event);
        }
      });
    }
  });

  // Setup default types
  
  // Text
  
  $.livetable.addType('text');

  // Textarea

  $.livetable.addType('textarea', function(data, td) {
    return $('<textarea></textarea>').attr({
      type: 'text',
      name:  data.name,
      id:    data.name
    }).text(td.text());
  });

  // Number

  $.livetable.addType('number', function(data, td, input) {
    input.val(parseInt(td.text(), 10));
    
    input.keypress(function(e){
      var key = String.fromCharCode(e.keyCode);
      if (key.match(/[^0-9\.]/) && ! (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    });
    
    return input;
  });
  
  // Plugin
  
  $.fn.livetable = function() {
    var first = arguments[0], second = arguments[1], third = arguments[2], options, method, lt;
    lt = $.livetable._get(this);
    
    if (first != 'option') {
      method = first;
      
      // If we need to return something specific, call method on first element
      if ($.inArray(method, $.livetable._return_methods) >= 0) {
        if (lt) {
          return lt[method]();
        }
      }
      // Otherwise, loop through all matched elements
      else {
        if (typeof(method) == 'object') {
          options = method;
        }
        
        $(this).each(function(){
          // Create
          if (options || method == '') {
            $.livetable._create(this, options);
          }
          else {
            lt = $.livetable._get(this);
            if ($.inArray(method, $.livetable._methods) >= 0 && lt) {
              lt[method](second);
            }
          }
          
        });
      }
    }
    // Options
    else if (lt) {
      var result = lt.option(second, third);
      if (typeof(third) != 'undefined') {
        return result;
      }
    }
    
    // Return jQuery object
    return this;
  };
  
})(jQuery);