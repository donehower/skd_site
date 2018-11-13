var margin = {top: 55, right: 55, bottom: 55, left: 55},
    w = 450 - margin.left - margin.right,
    h = 450 - margin.top - margin.bottom;

// d3.json("all_votes.json", function(data) {
function draw_dashboard(data) {
    data.forEach(function(d) {
      d.year = +d.year
      d.yeas = +d.yeas
      d.nays = +d.nays
    });

    var yrs = [];
    data.forEach(function(d) {
      if (!yrs.includes(d.year)) { yrs.push(d.year); }
    })
    yrs.sort();

    // Create stacked dataset
    var result_counts = [];
    for (var i = 0; i < yrs.length; i++) {
      var temp_data = data.filter(function(d) {  return d.year == yrs[i]; });
      temp_data.reduce(function (res, value) {
        if (!res[value.result]) {
            res[value.result] = {
                year: value.year,
                count: 0,
                result: value.result
            };
            result_counts.push(res[value.result])
        }
        res[value.result].count += 1;
        return res;
      }, {});
    }

    var stacked_data = [];
    function sum_cats(full_dataset, new_dataset, year) {
        var data_t = full_dataset.filter(function(d) {
        return d.year == year;
        });

        var t_obj = {},
            key = "year"
        t_obj[key] = year;

        data_t.forEach(function(d) {
            var key = d.result;
            t_obj[key] = d.count;
          })
        new_dataset.push(t_obj)
    }

    for (var i = 0; i < yrs.length; i++) {
      sum_cats(result_counts, stacked_data, yrs[i]);
    }

    // List of all possible result categories
    var possible_results = [];
    for (var i = 0; i < stacked_data.length; i++) {
      for (var j = 0; j < Object.keys(stacked_data[i]).length; j++) {
        if (!possible_results.includes(Object.keys(stacked_data[i])[j])) {
          possible_results.push(Object.keys(stacked_data[i])[j])
        }
      }
    }
    possible_results = possible_results.filter(function(item) {
      return item !== "year";
    });

    // Add in missing categories and assign zero value
    for (var i = 0; i < stacked_data.length; i++) {
      for (var j = 0; j < possible_results.length; j++) {
        if (!Object.keys(stacked_data[i]).includes(possible_results[j])) {
          stacked_data[i][possible_results[j]] = 0;
        }
      }
    }

    // Create color scale to use across all charts
    var google_colors = ["#dc3912", "#ff9900", "#109618", "#990099", "#0099c6",
      "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11",
      "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

    var colors_dict = {};
    possible_results.forEach((key, i) => colors_dict[key] = google_colors[i]);

    // ----------------- BAR CHART --------------------- //
    var barXscale = d3.scaleBand()
        .domain(d3.range(stacked_data.length))
        .rangeRound([0, w+100])
        .paddingInner(0.05);

    var barYscale = d3.scaleLinear()
        .domain([0, 650])
        .range([h, 0]);

    var barXaxis = d3.axisBottom()
        .scale(barXscale)
        .tickFormat((d, i) => yrs[i])
        .tickSize(2);

    var barYaxis = d3.axisLeft()
        .scale(barYscale);

    var s_bar = d3.select("#yearly_results")
        .append("svg")
        .attr("class", "s_bar")
        .attr("width", w + margin.left + margin.right + 100)
        .attr("height", h + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    s_bar.append("text")
        .attr("y", h + (margin.bottom/2))
        .attr("x",(w+100)/2)
        .attr("dy", "1.5em")
        .style("text-anchor", "middle")
        .attr("class", "xAxis_label")
        .text("Year");

    s_bar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left-5)
        .attr("x",0 - (h / 2))
        .attr("dy", "1.5em")
        .style("text-anchor", "middle")
        .attr("class", "yAxis_label")
        .text("Number of Votes");

    var stack = d3.stack()
        .keys(possible_results);

    function draw_bars(bar_data) {
        var series = stack(bar_data);

        var groups = s_bar.selectAll("g.s_bar")
            .data(series)
            .enter()
            .append("g")
            .attr("class", function(d, i) { return "cat_"+d.key; })
            .style("fill", function(d) {
              return colors_dict[d.key];
            })
            .style("stroke", "white")
            .style("stroke-width", 0.5)
            .on("mouseover", function(d, i) {
              var count = d.key,
                  xr = d3.event.pageX-120,
                  yr = -20,
                  cl = "rect.cat_"+d.key,
                  color = colors_dict[d.key];
                  console.log(color)
              showResult(count, xr, yr, color);
            })
            .on("mouseout", hideResult);

        s_bar.append("g")
            .attr("transform", "translate(0" + "," + h + ")")
            .attr("class", "bar_xAxis")
            .call(barXaxis)
          .selectAll("text")
                      .attr("y", 0)
                      .attr("x", 20)
                      .attr("dy", ".5em")
                      .attr("transform", "rotate(90)");

        s_bar.append("g")
              .attr("transform", "translate(0, 0)")
              .attr("class", "bar_yAxis")
              .call(barYaxis)
            .selectAll("text")
                      .attr("y", 0)
                      .attr("x", -10);

        var rects = groups.selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
              return barXscale(i);
            })
            .attr("y", function(d) {
              return barYscale(d[1]);
            })
            .attr("height", function(d) {
              return barYscale(d[0]) - barYscale(d[1]);
            })
            .attr("width", barXscale.bandwidth())
            .on("mouseover", function(d, i) {
              var count = d[1]-d[0];
              var xc = d3.event.pageX-120,
                  yc = 10;
              showCount(count, xc, yc);
            })
            .on("mouseout", hideCount);

    } // end of draw bars
    draw_bars(stacked_data);

    var stackedTool = d3.select(".stackedTool")
            .attr("display", "none");

    stackedTool.append("text")
          .attr("class", "stackedResult")
          .attr("text-anchor", "middle");

    stackedTool.append("text")
          .attr("class", "stackedCount")
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", 0)
          .attr("dy", -10);

    function showResult(result, xr, yr, color) {
          stackedTool.style("display", "inline")
              .style("left", (d3.event.pageX-15) + "px")
              .style("top", (250) + "px")
              .style("background-color", color);

          stackedTool.select("text.stackedResult")
              .style("display", null)
              .html(result + "</br>")
              .attr("x", xr)
              .attr("y", yr)
              .attr("fill", color);
    }

    function showCount(count, xc, yc) {
          stackedTool.style("display", "inline");

          stackedTool.select("text.stackedCount")
              .style("display", null)
              .text(count)
              .attr("x", xc)
              .attr("y", yc);
    }

    function hideResult() {
      stackedTool.style("display", "none");

      stackedTool.select("text.stackedResult")
              .style("display", "none");
    }

    function hideCount() {
      stackedTool.select("text.stackedCount")
              .style("display", "none");
    }

    var alpha_bar = s_bar.append("svg")
        .attr("width", w + margin.left + margin.right + 100)
        .attr("height", h + margin.top + margin.bottom)
        .attr("class", "alpha_bar")
      .append("g")
        .attr("transform", "translate(0,0)");

    var series = stack(stacked_data);

    var groups = alpha_bar.selectAll("g")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "all_alpha_bars")
        .style("fill", "none");

    var rects = groups.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("class", function(d, i) {
          return "yr_"+yrs[i]
        })
        .attr("x", function(d, i) {
          return barXscale(i);
        })
        .attr("height", h)
        .attr("width", barXscale.bandwidth());

  // --------------- SCATTER CHART ----------------- //

    var scatterXscale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, w]);

    var scatterYscale = d3.scaleLinear()
        .domain([0, 100])
        .range([h, 0]);

    // ----- Axes ----- //
    var scatterXaxis = d3.axisBottom()
        .scale(scatterXscale)
        .ticks(10)
        .tickSize(3);

    var scatterYaxis = d3.axisLeft()
        .scale(scatterYscale)
        .ticks(10)
        .tickSize(3);

    var scatter = d3.select("#vote_tallies")
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .attr("class", "scatter_plot")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    scatter.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + h + ")")
        .call(scatterXaxis);

    scatter.append("text")
        .attr("y", h + (margin.bottom/2))
        .attr("x",h/2)
        .attr("dy", "0.75em")
        .style("text-anchor", "middle")
        .attr("class", "xAxis_label")
        .text("Nays (count)");

    scatter.append("g")
        .attr("class", "yAxis")
        .call(scatterYaxis);

    scatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left/1.5)
        .attr("x",0 - (h / 2))
        .attr("dy", "0.75em")
        .style("text-anchor", "middle")
        .attr("class", "yAxis_label")
        .text("Yeas (count)");

    function draw_scatter(data_to_draw) {
        // Add scatter
        scatter.selectAll("circle")
            .data(data_to_draw)
            .enter()
            .append("circle")
            .attr("class", "circles")
            .attr("r", 3)
            .attr("cx", function(d) { return scatterXscale(d.nays); })
            .attr("cy", function(d) { return scatterYscale(d.yeas); })
            .style("fill", function(d) { return colors_dict[d.result]; })
            .style("fill-opacity", 0.3)
            .style("stroke", function(d) { return colors_dict[d.result]; })
            .style("pointer-events", "all")
            .on("mouseover", function(d) {
              draw_tooltip(d.year, d.title, scatterXscale(d.nays), scatterYscale(d.yeas));
            })
            .on("mouseout", hide_tooltip);
    }
    draw_scatter(data);

  // --------------- LEGEND ----------------- //
    colors_legend = []
    for (var each in colors_dict) {
      temp = {};
      temp['result'] = each,
      temp['color'] = colors_dict[each]
      colors_legend.push(temp)
    }
    var svgLegend = d3.select(".legend").append("svg")
                .attr("width", 150).attr("height", 100)
                .attr("class", "legend");

    var legend = svgLegend.selectAll('.legend')
                .data(colors_legend)
                .enter()
                .append('g')
                .attr("class", "legend")
                .attr("transform", function (d, i) {
                {
                    return "translate(0," + (i*15) + ")";
                }
            })

      legend.append("rect")
          .attr("x", 20)
          .attr("y", 20)
          .attr("width", 12)
          .attr("height", 12)
          .style("fill", function(d, i) {
            return d.color;
          })

      legend.append("text")
          .attr("x", 35)
          .attr("y", 30)
          .text(function(d) { return d.result; })
          .attr("class", "legend_text")
          .style("text-anchor", "start")
          .style("font-size", 14);

  // ------ SLIDER AND MENU FILTERS ------- //
    // Create dropdown menu
    var result_dropdown = document.getElementById('result_dropdown');
    for (var i = 0; i < possible_results.length; i++) {
        var opt = document.createElement('option');
        opt.innerHTML = possible_results[i];
        opt.value = possible_results[i];
        result_dropdown.appendChild(opt);
    }
    result_dropdown.selectedIndex = -1;

    //
    var slider = document.getElementById("year_slider"),
        result_dropdown = document.getElementById('result_dropdown'),
        selYear = null,
        selResult = null;

    d3.select("#year_slider").on("input", function() {
      selYear = +this.value;
      updateAll(+this.value, selResult);
    });

    d3.select("#result_dropdown").on("change", function() {
      selResult = this.value;
      updateAll(selYear, this.value);
    });

    function updateAll(selectedYear, selectedResult) {
          var filtered_data;
          if (selectedYear != null && selectedResult == null) {
                filtered_data = data;

                filtered_stack = stacked_data.filter(function(d) {
                  return d.year == selectedYear;
                });

                var selected_bar = "rect.yr_" + selectedYear;
                for (var i = 0; i < yrs.length; i++) {
                      var bar = "rect.yr_" + String(yrs[i]);

                      alpha_bar.selectAll(bar)
                            .attr("fill", "rgba(255, 255, 255, 0.1)");

                      if (bar == selected_bar) {
                        // console.log(stacked_data.filter(function(d) {
                        //   return d.year == selectedYear;
                        // }))
                        alpha_bar.selectAll(bar)
                              .attr("fill", "none");
                      }
                }
                filtered_data = data.filter(function(d) {
                      return d.year == selectedYear;
                })
                scatter.selectAll("circle").remove();
                draw_scatter(filtered_data);
          }

          if (selectedYear == null && selectedResult != null) {
                filtered_data = data.filter(function(d) {
                  return d.result == selectedResult;
                })
                scatter.selectAll("circle").remove();
                draw_scatter(filtered_data);
          }

          if (selectedYear != null && selectedResult != null) {

                var filtered_data = data.filter(function(d) {
                  if (d.result == selectedResult && d.year == selectedYear) {
                    return d;
                  }
                })

                var selected_bar = "rect.yr_" + selectedYear;
                for (var i = 0; i < yrs.length; i++) {
                  var bar = "rect.yr_" + String(yrs[i]);

                  alpha_bar.selectAll(bar)
                        .attr("fill", "rgba(255, 255, 255, 0.1)");

                  if (bar == selected_bar) {
                    alpha_bar.selectAll(bar)
                          .attr("fill", "none");
                  }
                }
                scatter.selectAll("circle").remove();
                draw_scatter(filtered_data);
            }

  } // end of updateAll

  d3.selectAll("#all_years")
        .on("click", function() {
            if (selResult != null) {
              var filtered_data = data.filter(function(d) {
                return d.result == selResult;
              })
              scatter.selectAll("circle").remove();
              draw_scatter(filtered_data);
            }
            if (selResult == null) {
              scatter.selectAll("circle").remove();
              draw_scatter(data);
            }
            for (var i = 0; i < yrs.length; i++) {
              var bar = "rect.yr_" + String(yrs[i]);

              alpha_bar.selectAll(bar)
                    .attr("fill", "none");
            }
            slider.value = 1988;
            selYear = null;

          }); // end of all_years onclick

    d3.selectAll("#all_results")
          .on("click", function() {
            if(selYear != null) {
              var filtered_data = data.filter(function(d) {
                return d.year == selYear;
              })
              scatter.selectAll("circle").remove();
              draw_scatter(filtered_data);
            }
            if (selYear == null) {
              scatter.selectAll("circle").remove();
              draw_scatter(data);
            }
            result_dropdown.selectedIndex = -1;
            selResult = null;
          }) // end of all_results onclick

    var tool = scatter.append("g")
            .attr("display", "none")
            .attr("class", "tool");

    tool.append("text")
          .attr("class", "toolYear")
          .attr("text-anchor", "start")
          .attr("x", 5)
          .attr("y", -10)
          .attr("dy", 0.1);

    tool.append("text")
          .attr("class", "toolText")
          .attr("text-anchor", "start")
          .attr("x", 15)
          .attr("y", -10)
          .attr("dy", 0.1);

    function draw_tooltip(year, title, nays, yeas) {

          tool.style("display", "inline");

          tool.select("text.toolYear")
              .style("display", null)
              .text("YEAR: " + year)
              .attr("transform", "translate(60,50)");

          tool.select("text.toolText")
              .style("display", null)
              .text("TITLE: " + title)
              .attr("transform", "translate(140, 50)")
              .call(wrap, 200);

          scatter.select("circle")
              .style("display", null)
              .attr("class", "toolCircle")
              .attr("r", 7)
              .attr("cx", nays)
              .attr("cy", yeas)
              .style("fill", "black")
              .style("fill-opacity", 0.3);

    } // end draw tooltip

    function hide_tooltip() {

          tool.style("display", "none");

          tool.select("rect.tool")
                .style("display", "none");

          tool.select("text.toolYear")
                .style("display", "none");

          tool.select("text.toolText")
                .style("display", "none");

          scatter.select("circle.toolCircle")
                .style("fill-opacity", 0)
                .style("display", "none");
    } // end of hide_tooltip

    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }

    function type(d) {
    d.value = +d.value;
    return d;
    }

  // for (var i=0; i<series.length; i++) {
  //   console.log(series[i].key)
  // }
}
// }) // end of json loads
