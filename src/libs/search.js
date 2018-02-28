function matchExpressions(searchWords) {
    return (row) => {
        var expressions = "";
        for (var i = 0; i < searchWords.length; i++) {
            var word = searchWords[i].replace(/'/g, "''").replace(/%/g, "[%]");
            var negate = false;
            if (word[0] == "-") {
                negate = true;
                word = word.slice(1);
                console.log(word);
            }
            expressions += "(SELECT COUNT(" + row + ") FROM zites AS " + row + "match" + i + " WHERE " + row + (negate ? " NOT" : "") + " LIKE '%" + word + "%' AND zites." + row + "=" + row + "match" + i + "." + row + " AND zites.id=" + row + "match" + i + ".id AND zites.json_id=" + row + "match" + i + ".json_id) AS " + row + "match" + i;
            if (i != searchWords.length - 1) {
                expressions += ", ";
            }
        }
        return expressions;
    }
}

function matches(searchWords) {
    return (row, multiplication) => {
        var s = "";
        for (var i = 0; i < searchWords.length; i++) {
            if (!multiplication) {
                s += row + "match" + i;
            } else {
                s += "(" + row + "match" + i + " * " + multiplication + ")";
            }
            if (i != searchWords.length - 1) {
                s += " + ";
            }
        }
        return s;
    }
}

// TODO: Rename searchMatchesAdded and searchMatchesOrderBy
// limit = 0, no limit
function searchDbQuery(zeroframe, searchQuery, options) {
    var offset = 0;
    if (options.limit && options.limit != 0)
        offset = (options.page || 0) * options.limit;
    var searchWords = searchQuery.split(" ").map((s) => {
        return s.replace(/'/g, "''").replace(/%/g, "[%]");
    }).filter((s) => {
        return s != "";
    });

    if (searchWords.length == 0) searchWords = [""];

    var matchExpressions_inner = matchExpressions(searchWords);
    var matches_inner = matches(searchWords);

    var searchSelects = "";
    var searchMatchesAdded = "";
    var searchMatchesOrderBy = "";
    for (var i = 0; i < options.searchSelects.length; i++) {
        var col = options.searchSelects[i].col;
        var score = options.searchSelects[i].score;
        var select = options.searchSelects[i].select;
        var matchName = options.searchSelects[i].matchName;
        var inSearchMatchesAdded = options.searchSelects[i].inSearchMatchesAdded != undefined ? options.searchSelects[i].inSearchMatchesAdded : true;
        var inSearchMatchesOrderBy = options.searchSelects[i].inSearchMatchesOrderBy != undefined ? options.searchSelects[i].inSearchMatchesOrderBy : true;

        if (select) {
            searchSelects += "(" + select + ") AS " + col;
        } else {
            searchSelects += matchExpressions_inner(col);
        }
        if (i != options.searchSelects.length - 1) {
            searchSelects += ", ";
        }

        if (inSearchMatchesAdded) {
            if (i != 0) {
                searchMatchesAdded += " + ";
            }
            if (select) {
                searchMatchesAdded += col;
            } else {
                searchMatchesAdded += matches_inner(col);
            }
        }

        if (options.orderByScore) {
            if (searchMatchesOrderBy == "")
                searchMatchesOrderBy = "(";
            if (inSearchMatchesOrderBy) {
                if (i != 0) {
                    searchMatchesOrderBy += " + ";
                }
                if (select) {
                    searchMatchesOrderBy += "(" + col + " * " + score + ")";
                } else {
                    searchMatchesOrderBy += matches_inner(col, score);
                }
            }
        }
    }

    searchMatchesOrderBy += ") " + (options.orderDirection || "DESC");

    var query = `
        SELECT ${options.select || "*"}
            ${searchSelects ? ", " + searchSelects : ""}
        FROM ${options.table}
        ${options.join || ""}
        WHERE ${options.where || ""}
            ${options.where && searchMatchesAdded ? "AND" : ""}
            ${searchMatchesAdded ? "(" + searchMatchesAdded + ") > 0" : ""}
        ${options.orderByScore && searchMatchesOrderBy ? "ORDER BY " + searchMatchesOrderBy : ""}
        ${options.limit ? "LIMIT " + options.limit : ""}
        ${options.limit ? "OFFSET " + offset : ""}
        `;
    console.log(query);
    return zeroframe.cmdp("dbQuery", [query]);
}

module.exports = searchDbQuery;