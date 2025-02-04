/* extension.js
 *
 * Copyright (C) 2024 Aryog <aryog@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {
  Extension,
  gettext as _, // eslint-disable-line no-unused-vars
} from 'resource:///org/gnome/shell/extensions/extension.js';

import {
  formatNepaliDateData,
  getCurrentNepaliDate,
  getYearDataFromCache
} from './utils/NepaliDateConverter.js';

const DAYS_OF_WEEK = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extensionPath) {
      super._init(0.0, 'Nepali Calendar');

      this._extensionPath = extensionPath;
      this._currentDate = getCurrentNepaliDate();

      // Create the top bar item
      this._topBox = new St.BoxLayout({
        style_class: 'np-cal-panel-status-menu-box'
      });

      this._topLabel = new St.Label({
        text: '',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'np-cal-top-bar-date-label'
      });

      this._topBox.add_child(this._topLabel);
      this.add_child(this._topBox);

      // Create the popup menu
      let menuItem = new PopupMenu.PopupMenuItem('');
      menuItem.sensitive = false;

      // Create calendar container
      this._calendarBox = new St.BoxLayout({
        vertical: true,
        style_class: 'np-calendar'
      });

      // Add month header
      this._monthLabel = new St.Label({
        style_class: 'np-calendar-month-year'
      });
      this._calendarBox.add_child(this._monthLabel);

      // Create calendar grid
      this._calendar = new St.Widget({
        style_class: 'np-calendar-grid',
        layout_manager: new Clutter.GridLayout({
          orientation: Clutter.Orientation.HORIZONTAL
        })
      });
      this._calendarBox.add_child(this._calendar);

      // Create day headers
      for (let i = 0; i < 7; i++) {
        let dayHeader = new St.Label({
          text: DAYS_OF_WEEK[i],
          style_class: 'np-calendar-day-heading'
        });
        this._calendar.layout_manager.attach(dayHeader, i, 0, 1, 1);
      }

      // Create day grid
      this._dayButtons = [];
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          let dayButton = new St.Button({
            style_class: 'np-calendar-day',
            can_focus: true
          });

          let dayLabel = new St.Label({
            style_class: 'np-calendar-day-label'
          });
          dayButton.set_child(dayLabel);

          this._calendar.layout_manager.attach(dayButton, col, row + 1, 1, 1);
          this._dayButtons.push({ button: dayButton, label: dayLabel });
        }
      }

      menuItem.add_child(this._calendarBox);
      this.menu.addMenuItem(menuItem);

      // Add info section
      this._infoBox = new St.BoxLayout({
        vertical: true,
        style_class: 'np-calendar-info'
      });

      this._tithiLabel = new St.Label({
        style_class: 'np-calendar-tithi'
      });

      this._eventLabel = new St.Label({
        style_class: 'np-calendar-events'
      });

      this._infoBox.add_child(this._tithiLabel);
      this._infoBox.add_child(this._eventLabel);

      let infoItem = new PopupMenu.PopupMenuItem('');
      infoItem.sensitive = false;
      infoItem.add_child(this._infoBox);
      this.menu.addMenuItem(infoItem);

      // Update display
      this._updateDisplay();
      this._updateCalendarGrid();

      // Set up automatic updates
      this._setupAutomaticUpdates();
    }

    _updateDisplay() {
      try {
        const dateInfo = formatNepaliDateData(this._currentDate, this._extensionPath);
        this._topLabel.set_text(`${dateInfo.nepaliDay} ${dateInfo.nepaliMonth} ${dateInfo.nepaliYear}`);
        this._monthLabel.set_text(`${dateInfo.nepaliMonth} ${dateInfo.nepaliYear}`);
        this._tithiLabel.set_text(dateInfo.nepaliTithi || '');
        this._eventLabel.set_text(dateInfo.nepaliEvent ? dateInfo.nepaliEvent.split('/').join('\n') : '');
      } catch (error) {
        logError(error, 'Failed to update display');
      }
    }

    _updateCalendarGrid() {
      try {
        const yearData = getYearDataFromCache(this._currentDate.nepaliYear, this._extensionPath);
        const monthData = yearData[this._currentDate.nepaliMonth - 1].days;

        const firstDayOfWeek = this._getFirstDayOfWeek(this._currentDate.nepaliYear, this._currentDate.nepaliMonth);

        // Clear all buttons
        this._dayButtons.forEach(({ button, label }) => {
          button.style_class = 'np-calendar-day';
          label.text = '';
        });

        // Fill in the days
        let dayCounter = 0;
        for (let i = 0; i < this._dayButtons.length && dayCounter < monthData.length; i++) {
          if (i < firstDayOfWeek) continue;

          const { button, label } = this._dayButtons[i];
          const dayData = monthData[dayCounter];

          // Use the 'day' field from JSON to display in Devanagari
          label.text = dayData.day;

          // Style current day
          if (parseInt(dayData.dayInEn) === this._currentDate.nepaliDay) {
            button.style_class = 'np-calendar-day np-calendar-today';
          }

          // Style holidays
          if (dayData.isHoliday) {
            button.add_style_class_name('np-calendar-holiday');
          }

          // Style Saturdays
          if (i % 7 === 6) {
            button.add_style_class_name('np-calendar-saturday');
          }

          dayCounter++;
        }
      } catch (error) {
        logError(error, 'Failed to update calendar grid');
      }
    }

    _getDaysInMonth(year, month) {
      // This is a simplified version - you should use your actual data
      const daysInMonth = {
        1: 31, 2: 31, 3: 31, 4: 32, 5: 31, 6: 31,
        7: 30, 8: 30, 9: 30, 10: 29, 11: 30, 12: 30
      };
      return daysInMonth[month] || 30;
    }

    _getFirstDayOfWeek(year, month) {
      // This should be calculated based on your actual data
      // For now, returning a simple calculation
      return (this._currentDate.dayOfWeek - ((this._currentDate.day - 1) % 7) + 7) % 7;
    }

    _setupAutomaticUpdates() {
      try {
        // Update at midnight
        const now = GLib.DateTime.new_now_local();
        const tomorrow = GLib.DateTime.new_local(
          now.get_year(),
          now.get_month(),
          now.get_day_of_month() + 1,
          0, 0, 0
        );

        const seconds = tomorrow.difference(now) / 1000000;

        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, seconds, () => {
          this._currentDate = getCurrentNepaliDate();
          this._updateDisplay();
          this._updateCalendarGrid();
          this._setupAutomaticUpdates();
          return GLib.SOURCE_REMOVE;
        });
      } catch (error) {
        logError(error, 'Failed to set up automatic updates');
      }
    }

    destroy() {
      if (this._timeout) {
        GLib.source_remove(this._timeout);
        this._timeout = null;
      }
      super.destroy();
    }
  }
);

export default class NepaliCalendar extends Extension {
  constructor(metadata) {
    super(metadata);
    this._extension = null;
    this._positionChangedId = null;
  }

  enable() {
    this._settings = this.getSettings();
    const position = this._settings.get_string('menu-position');

    this._extension = new Indicator(this.path);
    this._addToPanel(position);

    this._positionChangedId = this._settings.connect(
      'changed::menu-position',
      () => {
        const newPosition = this._settings.get_string('menu-position');
        this._moveIndicator(newPosition);
      }
    );
  }

  disable() {
    if (this._positionChangedId) {
      this._settings.disconnect(this._positionChangedId);
      this._positionChangedId = null;
    }

    if (this._settings) {
      this._settings = null;
    }

    if (this._extension) {
      this._removeFromPanel();
      this._extension.destroy();
      this._extension = null;
    }
  }

  _moveIndicator(newPosition) {
    this._removeFromPanel();
    this._addToPanel(newPosition);
  }

  _removeFromPanel() {
    const { container, menu } = this._extension;
    container?.get_parent()?.remove_child(container);
    Main.panel.menuManager.removeMenu(menu);
  }

  _addToPanel(position) {
    const positionMap = {
      left: Main.panel._leftBox,
      center: Main.panel._centerBox,
      right: Main.panel._rightBox,
    };

    const panelPosition = positionMap[position];
    panelPosition.insert_child_at_index(this._extension.container, -1);
    Main.panel.menuManager.addMenu(this._extension.menu);
  }
}

export function init() {
  return new NepaliCalendar();
}
