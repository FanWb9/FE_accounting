import { Briefcase, Cat } from "lucide-react";
import { Route, useNavigate } from "react-router-dom";
export default function MasterDashboard (){

    const Navigate = useNavigate();

    const MenuMaster = [
        {
            id:"Salesman",
            name :"Salesman",
            icon:Briefcase,
            description:"Catatan Data Salesman",
            color:'bg-blue-500',
            route: "/salesman",
            available: true
        },
         {
            id:"Salesman",
            name :"Salesman",
            icon:Briefcase,
            description:"Catatan Data Salesman",
            color:'bg-blue-500',
            route: "/salesman",
            available: true
        },
         {
            id:"Salesman",
            name :"Salesman",
            icon:Briefcase,
            description:"Catatan Data Salesman",
            color:'bg-blue-500',
            route: "/salesman",
            available: true
        },
         {
            id:"Salesman",
            name :"Salesman",
            icon:Briefcase,
            description:"Catatan Data Salesman",
            color:'bg-blue-500',
            route: "/salesman",
            available: false
        }
    ];

    const handleNavigateToReport = (route,name) =>{
        Navigate(route);
    };

    const availableReports = MenuMaster.filter(Cat => Cat.available).length;
    const totalReports = MenuMaster.length;

    return(
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header*/}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Master
                    </h1>
                    <p className="text-gray-600">
                        Kelola dan Lihat berbagai Master
                    </p>
                </div>
                {/* Category Fiekd */}
                <div className="grid grid-cols-3 gap-6">
                    {MenuMaster.map((category)=> {
                        const IconComponent = category.icon;
                        return (
                            <div
                                key={category.id}
                                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 ${
                                !category.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:transform hover:scale-105'
                                }`}
                            >
                            <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg ${category.color}`}>
                                <IconComponent className="h-6 w-6 text-white" />

                            </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 pl-3 pt-3">
                                    {category.name}
                                </h3>
                            </div>
                            
                            <div className="mb-4 ">
                                <p className="text-gray-600 text-sm">
                                    {category.description}
                                </p>
                            </div>
                                <button
                                disabled={!category.available}
                                    onClick={() => handleNavigateToReport(category.route, category.name)}
                                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                                        category.available
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    >
                                    {category.available ? 'Lihat Laporan' : 'Segera Hadir'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}