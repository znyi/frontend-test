import React from 'react';
import Plot from 'react-plotly.js';

function Graph(props) {
    const xs = props.xs;
    const ys = props.ys;

    const title = props.title

    const data = [{
        x: xs, 
        y: ys, 
        type: 'scattergl', //if too many points, graph will be very lag (need to use hovermode: false in this case)
        mode: 'lines+markers', 
        // type: 'pointcloud', //pointcloud is the fastest with hover
        // mode: 'markers', 
        marker: {color: 'blue',size: 5}
    }];

    const layout = {
        title: title,
        hovermode: 'closest',
    }

    const config = {
        scrollZoom: true,
        displaylogo: false
    }

    return (
        <div className='Graph'>
            <Plot
              data={ data }
              layout={ layout }
              config={ config }
            />
        </div>
    );
}

export default Graph;