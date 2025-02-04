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
} from './utils/NepaliDateConverter.js';

const DAYS_OF_WEEK = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extensionPath) {
      super._init(0.0, 'Nepali Date Extension');
      this._extensionPath = extensionPath;
      this._currentDate = getCurrentNepaliDate();
      this._displayDate = { ...this._currentDate };

      this._setupInterface();
      this._updateLabel();
    }

    _setupInterface() {
      // Top bar display
      this._box = new St.BoxLayout({
        style_class: 'np-cal-panel-status-menu-box',
      });
      this._nepaliDateLabel = new St.Label({
        text: '',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'np-cal-top-bar-date-label',
      });
      this._box.add_child(this._nepaliDateLabel);
      this.add_child(this._box);

      // Calendar popup
      this._calendar = new St.Widget({
        style_class: 'np-calendar',
        layout_manager: new Clutter.GridLayout(),
        reactive: true
      });

      // Create header with navigation
      this._createHeader();

      // Create calendar grid
      this._createCalendarGrid();

      // Add to menu
      const calendarItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false
      });
      calendarItem.add_child(this._calendar);
      this.menu.addMenuItem(calendarItem);

      // Add info section
      this._createInfoSection();
    }

    _createHeader() {
      const headerBox = new St.BoxLayout({
        style_class: 'np-calendar-header'
      });

      // Previous month button
      const prevButton = new St.Button({
        style_class: 'np-calendar-nav-button',
        child: new St.Icon({
          icon_name: 'go-previous-symbolic',
          icon_size: 16
        })
      });
      prevButton.connect('clicked', () => this._previousMonth());

      // Month/Year label
      this._monthLabel = new St.Label({
        style_class: 'np-calendar-month-year',
        x_expand: true,
        x_align: Clutter.ActorAlign.CENTER
      });

      // Next month button
      const nextButton = new St.Button({
        style_class: 'np-calendar-nav-button',
        child: new St.Icon({
          icon_name: 'go-next-symbolic',
          icon_size: 16
        })
      });
      nextButton.connect('clicked', () => this._nextMonth());

      headerBox.add_child(prevButton);
      headerBox.add_child(this._monthLabel);
      headerBox.add_child(nextButton);

      this._calendar.layout_manager.attach(headerBox, 0, 0, 7, 1);
    }

    _createCalendarGrid() {
      // Days of week headers
      DAYS_OF_WEEK.forEach((day, i) => {
        const label = new St.Label({
          text: day,
          style_class: 'np-calendar-day-heading'
        });
        this._calendar.layout_manager.attach(label, i, 1, 1, 1);
      });

      // Create day buttons grid
      this._buttons = [];
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
          const button = new St.Button({
            style_class: 'np-calendar-day-base',
            can_focus: true,
            x_expand: true,
            y_expand: true
          });
          this._calendar.layout_manager.attach(button, j, i + 2, 1, 1);
          this._buttons.push(button);
        }
      }
    }

    _createInfoSection() {
      const infoBox = new St.BoxLayout({
        vertical: true,
        style_class: 'np-calendar-info'
      });

      this._tithiLabel = new St.Label({
        style_class: 'np-calendar-tithi'
      });

      this._eventLabel = new St.Label({
        style_class: 'np-calendar-events'
      });

      infoBox.add_child(this._tithiLabel);
      infoBox.add_child(this._eventLabel);

      const infoItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false
      });
      infoItem.add_child(infoBox);
      this.menu.addMenuItem(infoItem);
    }

    _updateLabel() {
      const nepaliDateInfo = formatNepaliDateData(
        getCurrentNepaliDate(),
        this._extensionPath
      );
      this._nepaliDateLabel.set_text(
        `${nepaliDateInfo.nepaliDay} ${nepaliDateInfo.nepaliMonth} (${nepaliDateInfo.nepaliDayOfWeek})`
      );

      this._monthLabel.set_text(
        `${nepaliDateInfo.nepaliYear} ${nepaliDateInfo.nepaliMonth}`
      );

      this._tithiLabel.set_text(nepaliDateInfo.nepaliTithi);
      this._eventLabel.set_text(
        nepaliDateInfo.nepaliEvent.split('/').join('\n')
      );

      this._scheduleMidnightUpdate();
    }

    _scheduleMidnightUpdate() {
      const SECONDS_PER_DAY = 86400;
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = (midnight - now) / 1000;

      if (this._updateTimeout) {
        GLib.source_remove(this._updateTimeout);
      }
      try {
        this._updateTimeout = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          timeUntilMidnight,
          () => {
            this._updateLabel();
            this._dailyUpdateTimeout = GLib.timeout_add_seconds(
              GLib.PRIORITY_DEFAULT,
              SECONDS_PER_DAY,
              () => {
                this._updateLabel();
                return GLib.SOURCE_CONTINUE;
              }
            );
            return GLib.SOURCE_REMOVE;
          }
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to setup update timer:', error);
      }
    }

    destroy() {
      if (this._updateTimeout) {
        GLib.source_remove(this._updateTimeout);
        this._updateTimeout = null;
      }

      if (this._dailyUpdateTimeout) {
        GLib.source_remove(this._dailyUpdateTimeout);
        this._dailyUpdateTimeout = null;
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
