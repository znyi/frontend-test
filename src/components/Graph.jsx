import React from 'react';
import Plot from 'react-plotly.js';

function Graph(props) {
    const xs = props.xs;
    const ys = props.ys;

    const title = props.title

    const plots = [{
        x: xs, 
        y: ys, 
        type: 'scattergl', 
        mode: 'lines+markers', 
        marker: {color: 'blue',size: 5}
    }];

    return (
        <div className='MyPlot'>
            <Plot
              data={ plots }
              layout={ {title: title} }
            />
        </div>
    );
}

export default Graph;