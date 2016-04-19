import _ from 'lodash';
import uiModules from 'ui/modules';
import tabify from 'ui/agg_response/tabify/tabify';

const module = uiModules.get('kibana/heatmap', ['kibana']);

module.controller('KbnHeatmapController', function ($scope, Private) {
  const tabifyAggResponse = Private(tabify);

  function getLabel(agg, name) {
    return agg.bySchemaName[name] ? agg.bySchemaName[name][0].makeLabel() : '';
  }

  function processTableGroups(tableGroups, $scope) {
    const columnAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.columns, 'id'));
    const rowAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.rows, 'id'));
    const metricsAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.metric, 'id'));

    var dataLabels = { [columnAggId]: 'col', [rowAggId]: 'row', [metricsAggId]: 'value' };
    var cells = [];

    tableGroups.tables.forEach(function (table) {
      table.rows.forEach(function (row) {
        var cell = {};

        table.columns.forEach(function (column, i) {
          var fieldFormatter = table.aggConfig(column).fieldFormatter();
          // Median metric aggs use the parentId and not the id field
          var key = column.aggConfig.parentId ? dataLabels[column.aggConfig.parentId] : dataLabels[column.aggConfig.id];

          if (key) {
            cell[key] = key !== 'value' ? fieldFormatter(row[i]) : row[i];
          }
        });

        // if no columns or rows, then return '_all'
        if (!cell.col && !cell.row) {
          cell.col = '_all';
        }

        cells.push(cell);
      });
    });

    return cells;
  };

  $scope.$watch('esResponse', function (resp) {
    if (!resp) {
      $scope.data = null;
      return;
    }

    // Add row, column, and metric titles as vis parameters
    _.merge($scope.vis.params, {
      rowAxis: { title: getLabel($scope.vis.aggs, 'rows') },
      columnAxis: { title: getLabel($scope.vis.aggs, 'columns') },
      legendTitle: getLabel($scope.vis.aggs, 'metric')
    });

    $scope.data = [{
      cells: processTableGroups(tabifyAggResponse($scope.vis, resp), $scope)
    }];
  });
});
