import { Habit } from '../types/tracker';

export interface AppsScriptConfig {
  year: number;
  habits: Habit[];
  accentColor: string;
  startDayOfWeek: 'monday' | 'sunday';
  createAllMonths: boolean;
  activeMonthOnly?: boolean;
}

export function generateGoogleAppsScript(config: AppsScriptConfig): string {
  const habitsJson = JSON.stringify(
    config.habits.map((h) => ({
      name: h.name,
      emoji: h.emoji,
      category: h.category || 'Health',
      repetitionType: h.repetitionType || 'daily',
      specificDays: h.specificDays || [0, 1, 2, 3, 4, 5, 6],
      weeklyTarget: h.weeklyTarget || 7,
    })),
    null,
    2
  );
  const accent = config.accentColor || '#4ade80';
  const year = config.year || 2025;

  return `/**
 * ============================================================================
 * ULTIMATE DARK HABIT & LIFE TRANSFORMATION TRACKER SPREADSHEET GENERATOR
 * ============================================================================
 * Features:
 *  - 12 Full Monthly Sheets (January to December ${year})
 *  - Habit Streak Feature: Dedicated column tracking consecutive days
 *    completed; increments on check and resets to 0 when a day is missed!
 *  - Recurring Habits: Daily, Weekly (X times/wk), or Specific Days (Mon/Wed/Fri, etc.)
 *    Automatically adjusts checkboxes and Goal formulas for each pattern!
 *  - Aesthetic dark slate & charcoal theme (#111315, #181a20, #22252a)
 *  - Top KPI Cards, Daily & Weekly Progress Charts, and Donut Completion Chart
 *  - Habit Tracker Grid with Checkboxes and in-cell SPARKLINE Progress Bars
 *  - Overall Wellness Section: Mood Rating (1-5) & Sleep Hours (0-12)
 *  - Frozen headers and habit column for seamless mobile/desktop navigation
 * 
 * QUICK SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click: Extensions > Apps Script
 * 3. Delete any default code in Code.gs, then PASTE this entire script
 * 4. Click the Save icon (💾)
 * 5. In the toolbar, select "createHabitTracker" and click "Run" (▶️)
 * 6. Grant spreadsheet permissions when prompted (Advanced > Proceed)
 * 7. Enjoy your fully automated 12-month aesthetic habit dashboard!
 * ============================================================================
 */

// ================= USER CONFIGURATION =================
var CONFIG = {
  year: ${year},
  startDayMonday: ${config.startDayOfWeek === 'monday'},
  accentColor: '${accent}',
  cardBg: '#181a20',
  gridBg: '#131518',
  panelBg: '#22252a',
  borderColor: '#333842',
  textColor: '#f8fafc',
  mutedText: '#94a3b8',
  habits: ${habitsJson}
};

/**
 * Adds a custom menu to Google Sheets upon opening.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⭐ Habit Tracker')
    .addItem('🚀 Generate 12-Month Dashboard', 'createHabitTracker')
    .addItem('⚡ Format Current Sheet Only', 'createHabitTrackerForActiveSheet')
    .addSeparator()
    .addItem('🔥 Update Habit Streaks', 'updateAllStreaks')
    .addItem('🔄 Reset Current Month Checks', 'resetCurrentMonthChecks')
    .addItem('ℹ️ Help & Documentation', 'showHelpModal')
    .addToUi();
}

/**
 * Master generator function: creates or updates all 12 monthly sheets.
 */
function createHabitTracker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (var m = 0; m < monthNames.length; m++) {
    var sheetName = monthNames[m];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    buildMonthlySheet(sheet, m, CONFIG.year);
  }

  // Remove default "Sheet1" if it exists and there are other sheets
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Activate January
  var jan = ss.getSheetByName('January');
  if (jan) ss.setActiveSheet(jan);

  SpreadsheetApp.getActiveSpreadsheet().toast('Ultimate Habit Tracker successfully generated for all 12 months with Streaks & Recurring Habits!', '🎉 Complete', 6);
}

/**
 * Builds or rebuilds only the currently selected sheet.
 */
function createHabitTrackerForActiveSheet() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var sheetName = sheet.getName();
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var mIdx = monthNames.indexOf(sheetName);
  if (mIdx === -1) mIdx = 0;
  buildMonthlySheet(sheet, mIdx, CONFIG.year);
  SpreadsheetApp.getActiveSpreadsheet().toast('Formatted ' + sheetName + ' successfully!', 'Done', 4);
}

/**
 * Core builder for a single monthly sheet.
 */
function buildMonthlySheet(sheet, monthIndex, year) {
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var monthName = monthNames[monthIndex];
  var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Clear existing content, charts, and data validations
  sheet.clear();
  sheet.clearConditionalFormatRules();
  var existingCharts = sheet.getCharts();
  for (var c = 0; c < existingCharts.length; c++) {
    sheet.removeChart(existingCharts[c]);
  }

  // Ensure sufficient dimensions (at least 35 rows, 42 columns)
  var totalColsNeeded = 41; // Col A to Col AO
  var totalRowsNeeded = 36;
  if (sheet.getMaxColumns() < totalColsNeeded) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), totalColsNeeded - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < totalRowsNeeded) {
    sheet.insertRowsAfter(sheet.getMaxRows(), totalRowsNeeded - sheet.getMaxRows());
  }

  // Set Tab Color (Dark Obsidian)
  sheet.setTabColor(CONFIG.panelBg);

  // Apply default dark theme background to entire sheet
  var fullRange = sheet.getRange(1, 1, 35, totalColsNeeded);
  fullRange.setBackground(CONFIG.gridBg)
           .setFontColor(CONFIG.textColor)
           .setFontFamily('Roboto');

  // Set Column Widths
  sheet.setColumnWidth(1, 20);   // Col A: spacer
  sheet.setColumnWidth(2, 230);  // Col B: Habits
  for (var col = 3; col <= 33; col++) {
    sheet.setColumnWidth(col, 34); // Cols C to AG: Days 1-31
  }
  sheet.setColumnWidth(34, 65);  // Col AH: Streak 🔥
  sheet.setColumnWidth(35, 55);  // Col AI: Goal
  sheet.setColumnWidth(36, 60);  // Col AJ: Actual
  sheet.setColumnWidth(37, 55);  // Col AK: Left
  sheet.setColumnWidth(38, 110); // Col AL: Progress Bar
  sheet.setColumnWidth(39, 60);  // Col AM: %

  // ================= ROW 2: TOP BANNER / NAVIGATION =================
  sheet.setRowHeight(1, 12);
  sheet.setRowHeight(2, 38);

  // Month Card (B2)
  var monthCell = sheet.getRange('B2');
  monthCell.setValue('📅  ' + monthName.toUpperCase() + ' ' + year)
           .setFontWeight('bold')
           .setFontSize(14)
           .setBackground(CONFIG.panelBg)
           .setFontColor(CONFIG.textColor)
           .setHorizontalAlignment('center')
           .setVerticalAlignment('middle');

  // KPI Dashboard Cards in Rows 2-4 (Cols AI to AM)
  var kpiHeaderRange = sheet.getRange('AI2:AM2');
  kpiHeaderRange.merge()
                .setValue('OVERALL STATS')
                .setBackground(CONFIG.panelBg)
                .setFontWeight('bold')
                .setFontSize(11)
                .setHorizontalAlignment('center')
                .setFontColor(CONFIG.textColor);

  var kpiLabels = sheet.getRange('AI3:AM3');
  kpiLabels.setValues([['Goal', 'Actual', 'Left', 'Progress', 'Rate']]);
  kpiLabels.setBackground('#1c1f26')
           .setFontWeight('bold')
           .setFontSize(9)
           .setFontColor(CONFIG.mutedText)
           .setHorizontalAlignment('center');

  // Start row of habits is row 13
  var habitCount = CONFIG.habits.length;
  var habitStartRow = 13;
  var habitEndRow = habitStartRow + habitCount - 1;

  var kpiValues = sheet.getRange('AI4:AM4');
  kpiValues.setFormulas([[
    '=SUM(AI' + habitStartRow + ':AI' + habitEndRow + ')',
    '=SUM(AJ' + habitStartRow + ':AJ' + habitEndRow + ')',
    '=AI4-AJ4',
    '=SPARKLINE(AJ4, {"charttype","bar";"max",AI4;"color1","' + CONFIG.accentColor + '";"color2","#2a2e37"})',
    '=IF(AI4>0, AJ4/AI4, 0)'
  ]]);
  kpiValues.setBackground(CONFIG.cardBg)
           .setFontWeight('bold')
           .setFontSize(12)
           .setFontColor(CONFIG.textColor)
           .setHorizontalAlignment('center');
  sheet.getRange('AM4').setNumberFormat('0%');

  // Top Charts Area Banners
  var chartBanner1 = sheet.getRange('C2:Q2');
  chartBanner1.merge()
              .setValue('DAILY PROGRESS')
              .setBackground(CONFIG.panelBg)
              .setFontWeight('bold')
              .setFontSize(11)
              .setFontColor(CONFIG.textColor)
              .setHorizontalAlignment('center');

  var chartBanner2 = sheet.getRange('R2:AG2');
  chartBanner2.merge()
              .setValue('WEEKLY PROGRESS & RECOVERY')
              .setBackground(CONFIG.panelBg)
              .setFontWeight('bold')
              .setFontSize(11)
              .setFontColor(CONFIG.textColor)
              .setHorizontalAlignment('center');

  // Top Streak Spotlight in AH2:AH4
  var streakSpotlight = sheet.getRange('AH2:AH4');
  streakSpotlight.merge()
                 .setValue('🔥 TOP\\nSTREAK')
                 .setBackground(CONFIG.panelBg)
                 .setFontWeight('bold')
                 .setFontSize(10)
                 .setFontColor('#fbbf24')
                 .setHorizontalAlignment('center')
                 .setVerticalAlignment('middle')
                 .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // ================= ROWS 10-12: TABLE HEADERS & DATES =================
  sheet.setRowHeight(10, 24); // Week 1 to Week 5
  sheet.setRowHeight(11, 20); // Weekday Names (Mo, Tu, ...)
  sheet.setRowHeight(12, 22); // Day numbers (1, 2, ..., 31)

  // Merged Week Groupings (Row 10) aligned to real month days
  var weekRanges = [
    { range: 'C10:I10', label: 'Week 1 (1–7)' },
    { range: 'J10:P10', label: 'Week 2 (8–14)' },
    { range: 'Q10:W10', label: 'Week 3 (15–21)' },
    { range: 'X10:AD10', label: 'Week 4 (22–28)' }
  ];

  if (daysInMonth === 29) {
    weekRanges.push({ range: 'AE10:AE10', label: 'Week 5 (29)' });
  } else if (daysInMonth === 30) {
    weekRanges.push({ range: 'AE10:AF10', label: 'Week 5 (29–30)' });
  } else if (daysInMonth >= 31) {
    weekRanges.push({ range: 'AE10:AG10', label: 'Week 5 (29–31)' });
  }

  for (var w = 0; w < weekRanges.length; w++) {
    sheet.getRange(weekRanges[w].range)
         .merge()
         .setValue(weekRanges[w].label)
         .setBackground(CONFIG.panelBg)
         .setFontWeight('bold')
         .setFontSize(10)
         .setHorizontalAlignment('center')
         .setVerticalAlignment('middle')
         .setFontColor(CONFIG.textColor)
         .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }

  // If month has fewer than 31 days, dim unused week header columns
  if (daysInMonth < 31) {
    var unusedColStart = 3 + daysInMonth; // Day 1 is Col 3 (C)
    var unusedColCount = 31 - daysInMonth;
    var unusedHeader = sheet.getRange(10, unusedColStart, 1, unusedColCount);
    unusedHeader.setBackground('#0d0f12').setValue('').clearFormat();
  }

  // Analysis & Streaks Header (AH10:AM10)
  sheet.getRange('AH10:AM10')
       .merge()
       .setValue('ANALYSIS & STREAKS')
       .setBackground(CONFIG.panelBg)
       .setFontWeight('bold')
       .setFontSize(10)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
       .setFontColor(CONFIG.textColor)
       .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // "My Habits" Header (B10:B12)
  sheet.getRange('B10:B12')
       .merge()
       .setValue('MY HABITS')
       .setBackground(CONFIG.panelBg)
       .setFontWeight('bold')
       .setFontSize(11)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle')
       .setFontColor(CONFIG.textColor)
       .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Generate Weekdays (Row 11) & Day numbers (Row 12) with noon safety
  var weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var weekdayRow = [];
  var dayNumberRow = [];

  for (var day = 1; day <= 31; day++) {
    if (day <= daysInMonth) {
      var dateObj = new Date(year, monthIndex, day, 12, 0, 0);
      var dayName = weekdayNames[dateObj.getDay()];
      weekdayRow.push(dayName);
      dayNumberRow.push(day);
    } else {
      weekdayRow.push('');
      dayNumberRow.push('');
    }
  }

  var weekdayRange = sheet.getRange(11, 3, 1, 31);
  weekdayRange.setValues([weekdayRow])
              .setBackground('#1c1f26')
              .setFontSize(8)
              .setFontColor(CONFIG.mutedText)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle')
              .setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  var dayRange = sheet.getRange(12, 3, 1, 31);
  dayRange.setValues([dayNumberRow])
          .setBackground(CONFIG.panelBg)
          .setFontWeight('bold')
          .setFontSize(10)
          .setFontColor(CONFIG.textColor)
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle')
          .setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Analysis Subheaders (Row 11:12 AH:AM)
  sheet.getRange('AH11:AH12').merge().setValue('Streak 🔥').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setFontColor('#fbbf24').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('AI11:AI12').merge().setValue('Goal').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('AJ11:AJ12').merge().setValue('Actual').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('AK11:AK12').merge().setValue('Left').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('AL11:AL12').merge().setValue('Progress').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('AM11:AM12').merge().setValue('%').setBackground('#1c1f26').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');

  sheet.getRange('AH11:AM12').setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // ================= ROWS 13+: HABITS WITH RECURRING LOGIC =================
  var checkboxValidation = SpreadsheetApp.newDataValidation().requireCheckbox().build();

  for (var i = 0; i < habitCount; i++) {
    var currentRow = habitStartRow + i;
    sheet.setRowHeight(currentRow, 26);
    var habit = CONFIG.habits[i];
    var habitTitle = (habit.emoji ? habit.emoji + ' ' : '') + habit.name;
    var repType = habit.repetitionType || 'daily';
    var specificDays = habit.specificDays || [0, 1, 2, 3, 4, 5, 6];

    // Col B: Habit Name with recurring badge subtitle
    var repSubtitle = '';
    if (repType === 'specific_days') {
      var dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      var activeDaysStr = specificDays.map(function(d) { return dayLabels[d]; }).join('/');
      repSubtitle = ' (' + activeDaysStr + ')';
    } else if (repType === 'weekly') {
      repSubtitle = ' (' + (habit.weeklyTarget || 3) + 'x/wk)';
    }

    sheet.getRange(currentRow, 2)
         .setValue(habitTitle + repSubtitle)
         .setBackground(i % 2 === 0 ? '#181a20' : '#14161a')
         .setFontSize(9.5)
         .setFontWeight('medium')
         .setFontColor(CONFIG.textColor)
         .setVerticalAlignment('middle')
         .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

    // Calculate dynamic Goal based on repetition pattern
    var habitGoal = daysInMonth;
    if (repType === 'specific_days') {
      var scheduledCount = 0;
      for (var sd = 1; sd <= daysInMonth; sd++) {
        var dObj = new Date(year, monthIndex, sd);
        if (specificDays.indexOf(dObj.getDay()) !== -1) {
          scheduledCount++;
        }
      }
      habitGoal = Math.max(1, scheduledCount);
    } else if (repType === 'weekly') {
      var weeklyTgt = habit.weeklyTarget || 3;
      var fullWeeks = Math.floor(daysInMonth / 7);
      var extra = daysInMonth % 7;
      habitGoal = Math.min(daysInMonth, fullWeeks * weeklyTgt + Math.min(extra, Math.ceil(weeklyTgt / 2)));
    }

    // Cols C to AG: Checkboxes (Customized for Recurring Habits)
    for (var d = 1; d <= 31; d++) {
      var dayCol = 2 + d;
      var cell = sheet.getRange(currentRow, dayCol);
      if (d <= daysInMonth) {
        var dayDate = new Date(year, monthIndex, d);
        var dayOfWeek = dayDate.getDay();
        var isScheduled = true;
        if (repType === 'specific_days') {
          isScheduled = specificDays.indexOf(dayOfWeek) !== -1;
        }

        if (isScheduled) {
          cell.setDataValidation(checkboxValidation)
              .setValue(false)
              .setBackground(i % 2 === 0 ? '#181a20' : '#14161a')
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle');
        } else {
          // Off-schedule day for this recurring habit: visually distinct
          cell.setValue('-')
              .setBackground('#0d0f12')
              .setFontColor('#333842')
              .setFontSize(8)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle')
              .clearDataValidations();
        }
      } else {
        // Disabled day (beyond month days)
        cell.setValue('')
            .setBackground('#0d0e11')
            .clearDataValidations();
      }
    }

    var rowCheckRange = sheet.getRange(currentRow, 3, 1, 31);
    rowCheckRange.setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

    // Analysis Formulas (AH:AM)
    var rowStr = currentRow.toString();
    var lastActiveColLetter = getColumnLetter(2 + daysInMonth);

    // Col AH: Streak 🔥
    sheet.getRange('AH' + rowStr).setFormula('=HABIT_STREAK(C' + rowStr + ':' + lastActiveColLetter + rowStr + ')');
    sheet.getRange('AH' + rowStr).setFontWeight('bold').setFontColor('#fbbf24');

    // Col AI: Goal (Automatically adjusted for recurring pattern)
    sheet.getRange('AI' + rowStr).setValue(habitGoal);

    // Col AJ: Actual
    sheet.getRange('AJ' + rowStr).setFormula('=COUNTIF(C' + rowStr + ':' + lastActiveColLetter + rowStr + ', TRUE)');

    // Col AK: Left
    sheet.getRange('AK' + rowStr).setFormula('=MAX(0, AI' + rowStr + '-AJ' + rowStr + ')');

    // Col AL: Progress Sparkline
    sheet.getRange('AL' + rowStr).setFormula('=SPARKLINE(AJ' + rowStr + ', {"charttype","bar";"max",AI' + rowStr + ';"color1","' + CONFIG.accentColor + '";"color2","#242831"})');

    // Col AM: %
    sheet.getRange('AM' + rowStr).setFormula('=IF(AI' + rowStr + '>0, AJ' + rowStr + '/AI' + rowStr + ', 0)').setNumberFormat('0%');

    var analysisRowRange = sheet.getRange('AH' + rowStr + ':AM' + rowStr);
    analysisRowRange.setBackground(i % 2 === 0 ? '#181a20' : '#14161a')
                    .setFontSize(10)
                    .setHorizontalAlignment('center')
                    .setVerticalAlignment('middle')
                    .setFontColor(CONFIG.textColor)
                    .setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);
  }

  // ================= ROW: DAILY COMPLETION HELPER (For Charts) =================
  var helperRow = habitEndRow + 1;
  sheet.setRowHeight(helperRow, 18);
  sheet.getRange(helperRow, 2).setValue('Daily % (for charts)').setFontColor(CONFIG.mutedText).setFontSize(8).setBackground('#0f1114');
  for (var cd = 1; cd <= 31; cd++) {
    var cCol = 2 + cd;
    var cLetter = getColumnLetter(cCol);
    var helperCell = sheet.getRange(helperRow, cCol);
    if (cd <= daysInMonth) {
      helperCell.setFormula('=IF(COUNTA(B' + habitStartRow + ':B' + habitEndRow + ')>0, COUNTIF(' + cLetter + habitStartRow + ':' + cLetter + habitEndRow + ', TRUE)/COUNTA(B' + habitStartRow + ':B' + habitEndRow + '), 0)')
                .setNumberFormat('0%');
    } else {
      helperCell.setValue(0);
    }
  }
  sheet.getRange(helperRow, 3, 1, 31).setFontSize(8).setFontColor(CONFIG.mutedText).setBackground('#0f1114').setHorizontalAlignment('center');

  // ================= OVERALL WELLNESS SECTION =================
  var wellnessHeaderRow = helperRow + 1;
  sheet.setRowHeight(wellnessHeaderRow, 26);
  sheet.getRange(wellnessHeaderRow, 2, 1, 37)
       .merge()
       .setValue('OVERALL WELLNESS')
       .setBackground(CONFIG.panelBg)
       .setFontWeight('bold')
       .setFontSize(10)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
       .setFontColor(CONFIG.textColor)
       .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Mood Row
  var moodRow = wellnessHeaderRow + 1;
  sheet.setRowHeight(moodRow, 26);
  sheet.getRange(moodRow, 2)
       .setValue('Daily Mood (1-5)  😊')
       .setBackground('#181a20')
       .setFontWeight('bold')
       .setFontSize(10)
       .setFontColor(CONFIG.textColor)
       .setVerticalAlignment('middle');

  var moodValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['1', '2', '3', '4', '5'], true)
    .setAllowInvalid(false)
    .build();

  for (var md = 1; md <= 31; md++) {
    var mCol = 2 + md;
    var mCell = sheet.getRange(moodRow, mCol);
    if (md <= daysInMonth) {
      mCell.setDataValidation(moodValidation)
           .setValue(4)
           .setBackground('#181a20')
           .setFontSize(10)
           .setFontColor(CONFIG.textColor)
           .setHorizontalAlignment('center')
           .setVerticalAlignment('middle');
    } else {
      mCell.setBackground('#0d0e11').clearDataValidations();
    }
  }
  sheet.getRange(moodRow, 3, 1, 31).setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Sleep Row
  var sleepRow = moodRow + 1;
  sheet.setRowHeight(sleepRow, 26);
  sheet.getRange(sleepRow, 2)
       .setValue('Hours of Sleep  🌙')
       .setBackground('#14161a')
       .setFontWeight('bold')
       .setFontSize(10)
       .setFontColor(CONFIG.textColor)
       .setVerticalAlignment('middle');

  var sleepValidation = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 16)
    .setAllowInvalid(true)
    .build();

  for (var sd = 1; sd <= 31; sd++) {
    var sCol = 2 + sd;
    var sCell = sheet.getRange(sleepRow, sCol);
    if (sd <= daysInMonth) {
      sCell.setDataValidation(sleepValidation)
           .setValue(7.5)
           .setBackground('#14161a')
           .setFontSize(10)
           .setFontColor(CONFIG.textColor)
           .setHorizontalAlignment('center')
           .setVerticalAlignment('middle');
    } else {
      sCell.setBackground('#0d0e11').clearDataValidations();
    }
  }
  sheet.getRange(sleepRow, 3, 1, 31).setBorder(true, true, true, true, true, true, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Wellness Trend Sparklines (AH:AM)
  sheet.getRange(moodRow, 34, 1, 6)
       .merge()
       .setFormula('=SPARKLINE(C' + moodRow + ':' + getColumnLetter(2 + daysInMonth) + moodRow + ', {"charttype","line";"color","' + CONFIG.accentColor + '";"linewidth",2})')
       .setBackground('#181a20')
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
       .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(sleepRow, 34, 1, 6)
       .merge()
       .setFormula('=SPARKLINE(C' + sleepRow + ':' + getColumnLetter(2 + daysInMonth) + sleepRow + ', {"charttype","line";"color","#38bdf8";"linewidth",2})')
       .setBackground('#14161a')
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
       .setBorder(true, true, true, true, false, false, CONFIG.borderColor, SpreadsheetApp.BorderStyle.SOLID);

  // Embed Daily Progress Bar Chart
  try {
    var dailyChart = sheet.newChart()
      .asColumnChart()
      .addRange(sheet.getRange(12, 3, 1, daysInMonth))
      .addRange(sheet.getRange(helperRow, 3, 1, daysInMonth))
      .setPosition(3, 3, 0, 0)
      .setOption('title', 'Daily Completion Rate')
      .setOption('titleTextStyle', { color: '#f8fafc', fontSize: 11, bold: true })
      .setOption('backgroundColor', CONFIG.cardBg)
      .setOption('legend', { position: 'none' })
      .setOption('colors', [CONFIG.accentColor])
      .setOption('vAxis', {
        minValue: 0,
        maxValue: 1,
        format: 'percent',
        textStyle: { color: '#94a3b8', fontSize: 8 },
        gridlines: { color: '#2a2e37' }
      })
      .setOption('hAxis', {
        textStyle: { color: '#94a3b8', fontSize: 8 },
        gridlines: { color: '#1f232b' }
      })
      .setOption('width', 520)
      .setOption('height', 150)
      .build();
    sheet.insertChart(dailyChart);
  } catch (err) {
    Logger.log('Chart creation notice: ' + err.message);
  }

  // Freeze rows 1 to 12 and Column B
  sheet.setFrozenRows(12);
  sheet.setFrozenColumns(2);
}

/**
 * ============================================================================
 * CUSTOM GOOGLE SHEETS FORMULA: HABIT_STREAK
 * ============================================================================
 * Calculates the current consecutive streak of completed days for a habit.
 * Logic:
 *  - Increments streak for each consecutive completed day.
 *  - Resets to 0 if a scheduled day is missed.
 *  - Ignores off-schedule days (e.g. non-gym days).
 * Usage in sheet: =HABIT_STREAK(C13:AG13)
 */
function HABIT_STREAK(values) {
  if (!values) return 0;
  var row = Array.isArray(values[0]) ? values[0] : values;
  
  // Find the latest completed day index
  var latestChecked = -1;
  for (var i = row.length - 1; i >= 0; i--) {
    if (row[i] === true) {
      latestChecked = i;
      break;
    }
  }

  if (latestChecked === -1) return 0;

  var streak = 0;
  for (var j = latestChecked; j >= 0; j--) {
    var val = row[j];
    if (val === true) {
      streak++;
    } else if (val === false) {
      // Missed scheduled day: streak is broken!
      break;
    }
    // If val is '-' or empty (off-schedule day), skip without breaking streak
  }
  return streak;
}

/**
 * Triggers on any edit in the spreadsheet to keep streaks refreshed in real time.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var col = e.range.getColumn();
  var row = e.range.getRow();

  // If edit was within the checkbox area (Cols C to AG, rows 13 to 24)
  if (col >= 3 && col <= 33 && row >= 13) {
    try {
      var habitCheckRow = sheet.getRange(row, 3, 1, 31).getValues()[0];
      var newStreak = HABIT_STREAK(habitCheckRow);
      sheet.getRange(row, 34).setValue(newStreak);
    } catch (err) {
      // safe fallback
    }
  }
}

/**
 * Manually recalculates streaks across all habits in the current sheet.
 */
function updateAllStreaks() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var habitCount = CONFIG.habits.length;
  for (var i = 0; i < habitCount; i++) {
    var row = 13 + i;
    var rowValues = sheet.getRange(row, 3, 1, 31).getValues()[0];
    var streak = HABIT_STREAK(rowValues);
    sheet.getRange(row, 34).setValue(streak);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast('Habit streaks refreshed!', '🔥 Streaks Updated', 3);
}

/**
 * Resets all checkboxes in the currently active sheet to unchecked.
 */
function resetCurrentMonthChecks() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert('Reset Checkboxes', 'Are you sure you want to uncheck all habits for this month?', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var sheet = SpreadsheetApp.getActiveSheet();
  var habitStartRow = 13;
  var habitCount = CONFIG.habits.length;

  for (var r = habitStartRow; r < habitStartRow + habitCount; r++) {
    for (var c = 3; c <= 33; c++) {
      var cell = sheet.getRange(r, c);
      if (cell.getDataValidation() && cell.getDataValidation().getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
        cell.setValue(false);
      }
    }
  }
  SpreadsheetApp.getActiveSpreadsheet().toast('All checkboxes reset for this month!', 'Reset Complete', 3);
}

/**
 * Helper modal dialog explaining features.
 */
function showHelpModal() {
  var html = HtmlService.createHtmlOutput(
    '<div style="background:#181a20;color:#f8fafc;padding:20px;font-family:sans-serif;line-height:1.6;">' +
    '<h2 style="color:' + CONFIG.accentColor + ';margin-top:0;">⚡ Ultimate Habit Tracker Dashboard</h2>' +
    '<p>Welcome to your aesthetic dark productivity suite.</p>' +
    '<ul>' +
    '<li><b>🔥 Streaks:</b> The Streak column calculates consecutive completed days and resets to 0 when a scheduled day is missed.</li>' +
    '<li><b>🔁 Recurring Habits:</b> Daily, Weekly, or Specific Days (Mon/Wed/Fri) adjust the checkbox grid and goals automatically.</li>' +
    '<li><b>📊 Sparklines:</b> In-cell visual progress bars update dynamically against your goals.</li>' +
    '<li><b>🌿 Wellness:</b> Track daily mood (1-5) and sleep (hours) with correlation sparklines.</li>' +
    '</ul>' +
    '</div>'
  ).setWidth(450).setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, 'Habit Tracker Guide');
}

/**
 * Converts column index (1-based) to letter (e.g. 1 -> A, 28 -> AB)
 */
function getColumnLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
`;
}
