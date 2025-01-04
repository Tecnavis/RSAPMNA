import React, { useRef } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import IconSend from '../../components/Icon/IconSend';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconDownload from '../../components/Icon/IconDownload';
import IconPlus from '../../components/Icon/IconPlus';
interface Booking {
    id: string;
    dateTime: string;
    fileNumber: string;
    updatedTotalSalary: number;
    receivedAmount: number;
    balance: number;
    companyName: string;
}

const SelectiveReportInvoice = () => {
    const location = useLocation();
    const { bookings } = location.state || { bookings: [] as Booking[] };
    const invoiceRef = useRef<HTMLDivElement>(null);

    if (!bookings || bookings.length === 0) {
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
        const invoiceContent = document.getElementById('invoice-content');
        if (invoiceContent) {
            try {
                const canvas = await html2canvas(invoiceContent);
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`invoice-${generateInvoiceNumber()}.pdf`);
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        } else {
            console.error('Invoice content not found');
        }
    };

    // Calculate total payable amount
    const totalPayableAmount = bookings.reduce((total:any, booking:any) => total + Number(booking.updatedTotalSalary), 0);
    const totalBalanceAmount = bookings.reduce((total:any, booking:any) => total + Number(booking.balance), 0);
    
    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'serviceType', label: 'Service Type' },
        { key: 'vehicleNumber', label: 'Vehicle Number', class: 'text-center' },
        { key: 'updatedTotalSalary', label: 'Amount of Bookings', class: 'text-center' },
        { key: 'receivedAmount', label: 'Amount Received from Company', class: 'text-center' },
        { key: 'balance', label: 'Balance' },
    ];

    return (
        <div>
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button type="button" className="btn btn-primary gap-2" onClick={handlePrint}>
                    <IconPrinter />
                    Print
                </button>

                <button type="button" className="btn btn-success gap-2" onClick={handleDownload}>
                    <IconDownload />
                    Download
                </button>
            </div>
            <div className="panel" ref={invoiceRef} id="invoice-content">
                <div className="flex justify-between flex-wrap gap-4 px-4">
                    <div className="text-2xl font-semibold uppercase">Invoice</div>
                    <div className="shrink-0">
                        <img
                            src="/assets/images/auth/rsa-png.png"
                            alt="img"
                            className="w-24 ltr:ml-auto rtl:mr-auto"
                        />
                    </div>
                </div>
                <div className="ltr:text-right rtl:text-left px-4">
                    <div className="space-y-1 mt-6 text-white-dark">
                        <div>perinthalmanna Road, kerala, 33884, India</div>
                        <div>rsa@gmail.com</div>
                        <div>+91 9817100100</div>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="flex justify-between lg:flex-row flex-col gap-6 flex-wrap">
                    <div className="flex-1">
                        <div className="space-y-1 text-white-dark">
                            <div>Issue For:</div>
                            <div className="text-black dark:text-white font-semibold">{bookings[0].driver}</div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Invoice :</div>
                                <div>{generateInvoiceNumber()}</div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Issue Date :</div>
                                <div>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="table-striped w-full">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key} className={column.class}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking:any, index:any) => (
                                <tr key={booking.id}>
                                    <td>{index + 1}</td>
                                    <td>{booking.dateTime}</td>
                                    <td className="text-center">{booking.fileNumber}</td>
                                    <td className="text-center">{booking.updatedTotalSalary}</td>
                                    <td className="text-center">{booking.receivedAmount}</td>
                                    <td className="text-center">{booking.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 px-4">
                    <div className="flex justify-end font-semibold text-lg text-gray-800">
                        Total Payable Amount: <span className="ml-2 text-blue-600">{totalPayableAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-end font-semibold text-lg text-gray-800">
                        Balance Amount: <span className="ml-2 text-blue-600">{totalBalanceAmount.toFixed(2)}</span>
                    </div>
                </div>
               
            </div>
        </div>
    );
};

export default SelectiveReportInvoice;
