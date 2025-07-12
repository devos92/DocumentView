import {Line} from "react-chartjs-2";
import { 
    Chart as ChartJS,
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement,
    Title,
    Tooltip,
    Legend,
);


export const LineGraph = ({graphData}) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: "Number of completed issues per month"
            }
        },
        scales: {
            y: {
                ticks: {
                    stepSize: 1,
                }
            }
        }
    };
    
    return (
        <Line options={options} data={graphData}/>
    )
}