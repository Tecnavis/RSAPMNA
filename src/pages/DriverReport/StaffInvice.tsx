import React, { useRef } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import IconSend from '../../components/Icon/IconSend';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconDownload from '../../components/Icon/IconDownload';
import IconPlus from '../../components/Icon/IconPlus';

const StaffInvice = () => {
    const location = useLocation();
    const { staff, entries: bookings } = location.state || { bookings: [] }; // Renamed entries to bookings
    const invoiceRef = useRef<HTMLDivElement>(null);
    console.log("staff", bookings);
    
    if (!staff || bookings.length === 0) {
        return <div>No bookings selected for invoice generation.</div>;
    }

    const generateInvoiceNumber = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
        const day = ('0' + currentDate.getDate()).slice(-2);
        const hours = ('0' + currentDate.getHours()).slice(-2);
        const minutes = ('0' + currentDate.getMinutes()).slice(-2);
        const seconds = ('0' + currentDate.getSeconds()).slice(-2);

        return `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;
    };

    const handlePrint = () => {
        const printContent = invoiceRef.current?.innerHTML;
        const originalContent = document.body.innerHTML;

        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        }
    };

    const handleDownload = async () => {
        const invoiceContent = invoiceRef.current;
        if (invoiceContent) {
            const canvas = await html2canvas(invoiceContent);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${generateInvoiceNumber()}.pdf`);
        }
    };

    // Calculate total payable amount
    const totalPayableAmount = bookings.reduce((total:any, booking:any) => total + ( Number(booking.amount)), 0);

    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'amount', label: 'Amount', class: 'text-center' },
        { key: 'amountGiven', label: 'Given Amount', class: 'text-center' },
        { key: 'balanceSalary', label: 'Balance', class: 'text-center' },
    ];

    const handleInvoiceClick = () => {
        console.log('Invoice clicked');
    };

    return (
        <div className="p-6 bg-gray-100">
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button 
                    type="button" 
                    className="flex items-center btn btn-info gap-2 px-4 py-2 rounded-md shadow" 
                    onClick={handleInvoiceClick}
                >
                    <IconSend />
                    Send Invoice
                </button>

                <button 
                    type="button" 
                    className="flex items-center btn btn-primary gap-2 px-4 py-2 rounded-md shadow" 
                    onClick={handlePrint}
                >
                    <IconPrinter />
                    Print
                </button>

                <button 
                    type="button" 
                    className="flex items-center btn btn-success gap-2 px-4 py-2 rounded-md shadow" 
                    onClick={handleDownload}
                >
                    <IconDownload />
                    Download
                </button>

                <Link 
                    to="/apps/invoice/add" 
                    className="flex items-center btn btn-secondary gap-2 px-4 py-2 rounded-md shadow"
                >
                    <IconPlus />
                    Create
                </Link>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-4" ref={invoiceRef}>
                <div className="flex justify-between flex-wrap gap-4">
                    <div className="text-2xl font-bold uppercase text-gray-800">Invoice</div>
                    <div className="shrink-0">
                        <img
                            src="/assets/images/auth/rsa-png.png"
                            alt="Logo"
                            className="w-24 ml-auto"
                        />
                    </div>
                </div>
                <div className="text-right mt-6 text-gray-600">
                    <div>Perinthalmanna Road, Kerala, 33884, India</div>
                    <div>rsa@gmail.com</div>
                    <div>+91 9817100100</div>
                </div>
                <hr className="border-gray-300 my-6" />
                <div className="flex justify-between lg:flex-row flex-col gap-6 flex-wrap">
                    <div className="flex-1">
                        <div className="space-y-1 text-gray-600">
                            <div>Issue For:</div>
                            <div className="text-black font-semibold">{staff.userName}</div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center justify-between mb-2 text-gray-600">
                                <div>Invoice:</div>
                                <div>{generateInvoiceNumber()}</div>
                            </div>
                            <div className="flex items-center justify-between mb-2 text-gray-600">
                                <div>Issue Date:</div>
                                <div>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                {columns.map((column) => (
                                    <th key={column.key} className={`${column.class} border border-gray-300 p-2 text-left`}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking:any, index:any) => {
                                // Calculate the balance for each booking
                                const balance = Number(booking.amount) - Number(booking.amountGiven);
                                return (
                                    <tr key={booking.id} className="hover:bg-gray-100">
                                        <td className="border border-gray-300 p-2">{index + 1}</td>
                                        <td className="border border-gray-300 p-2 text-center">{booking.amount}</td>
                                        <td className="border border-gray-300 p-2 text-center">{booking.amountGiven}</td>
                                        <td className="border border-gray-300 p-2 text-center">{balance.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 px-4">
                    <div className="flex justify-end font-semibold text-lg text-gray-800">
                        Total Payable Amount: <span className="ml-2 text-blue-600">{totalPayableAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffInvice;
