function responsiveCellHeaders(element) {

    // Generate ID if not present
    if (!element.id) {
        element.id = 'table-' + Date.now().toString();
    }

    try {
        var THarray = [];
        var ths = element.getElementsByTagName("th");
        for (var i = 0; i < ths.length; i++) {
            var headingText = ths[i].innerHTML;
            THarray.push(headingText);
        }
        var styleElm = document.createElement("style"),
            styleSheet;
        document.head.appendChild(styleElm);
        styleSheet = styleElm.sheet;
        for (var i = 0; i < THarray.length; i++) {
            styleSheet.insertRule(
                "#" +
                element.id +
                " td:nth-child(" +
                (i + 1) +
                ')::before {content:"' +
                THarray[i] +
                ': ";}',
                styleSheet.cssRules.length
            );
        }
    } catch (e) {
        console.log("responsiveCellHeaders(): " + e);
    }
}

function addTableAria(element) {
    try {
        var allTables = document.querySelectorAll('table');
        for (var i = 0; i < allTables.length; i++) {
            element.setAttribute('role', 'table');
        }
        var allRowGroups = element.querySelectorAll('thead, tbody, tfoot');
        for (var i = 0; i < allRowGroups.length; i++) {
            allRowGroups[i].setAttribute('role', 'rowgroup');
        }
        var allRows = element.querySelectorAll('tr');
        for (var i = 0; i < allRows.length; i++) {
            allRows[i].setAttribute('role', 'row');
        }
        var allCells = element.querySelectorAll('td');
        for (var i = 0; i < allCells.length; i++) {
            allCells[i].setAttribute('role', 'cell');
        }
        var allHeaders = element.querySelectorAll('th');
        for (var i = 0; i < allHeaders.length; i++) {
            allHeaders[i].setAttribute('role', 'columnheader');
        }
        // this accounts for scoped row headers
        var allRowHeaders = element.querySelectorAll('th[scope=row]');
        for (var i = 0; i < allRowHeaders.length; i++) {
            allRowHeaders[i].setAttribute('role', 'rowheader');
        }
        // caption role not needed as it is not a real role and
        // browsers do not dump their own role with display block
    } catch (e) {
        console.log("addTableARIA(): " + e);
    }
}