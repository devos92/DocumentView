import {Bar} from "react-chartjs-2";
import { 
    Chart as ChartJS,
    CategoryScale, 
    LinearScale, 
    Title,
    Tooltip,
    Legend,
    BarElement,
} from "chart.js";

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement,
    Title,
    Tooltip,
    Legend,
);


export const BarGraph = ({graphData}) => {

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: "Number of issues added per month",
            }
        }
    };
    
    return (
        <Bar options={options} data={graphData}/>
    )
}