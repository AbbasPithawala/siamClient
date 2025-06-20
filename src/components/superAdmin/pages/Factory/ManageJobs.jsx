import React from "react";
import "./factory.css";
import { Link } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { axiosInstance } from "./../../../../config";
import { Context } from "../../../../context/Context";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { renderToString } from "react-dom/server";
import jsPDF from "jspdf";
import Logo from "../../../../images/logo.png";
import mainQR from "../../../../images/PDFQR.png";
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const completeStyle = {
  padding: "7px 20px",
  backgroundColor: "#0094122e",
  color: "green",
  fontWeight: "600",
  borderRadius: "5px",
};

const inCompleteStyle = {
  padding: "7px 20px",
  backgroundColor: "#eb00002e",
  color: "red",
  fontWeight: "600",
  borderRadius: "5px",
};

const inCompleteStyle2 = {
  padding: "7px 20px",
  backgroundColor: "#eb00002e",
  color: "red",
  fontWeight: "600",
  borderRadius: "5px",
};
export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const { user } = useContext(Context);
  const [showJobs, setShowJobs] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [tailors, setTailors] = useState([]);
  const [tailor, setTailor] = useState({});
  const [costChk, setCostChk] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [today, setToday] = useState(new Date().toLocaleDateString("es-CL"));
  const [jobIDArray, setJobIDArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [extraPaymentCategories, setExtraPaymentCategories] = useState([])
  const [showRetailers, setShowRetailers] = useState(false)
  const [jobId, setJobId] = useState("")
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  // extra payment states=======================================

  // const [workerExtraPayment, setWorkerExtraPayment] = useState({});
  // const [workerExtraPayments, setWorkerExtraPayments] = useState([]);
  // const [showWorkerExtraPayments, setShowWorkerExtraPayments] = useState(false);
  // const[extraPaymentsIDArray, setExtraPaymentsIDArray] = useState([]);

  // payment States======================================
  const [tailorAdvance, setTailorAdvance] = useState(0);
  const [deductedAdvance, setDeductedAdvance] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [manualBill, setManualBill] = useState(0);
  const [totalPay, setTotalPay] = useState(0);
  const [rent, setRent] = useState(0);


  useEffect(() => {
    fetchTailors();
    fetchExtraPaymentCategories();
  }, []);

  const handleClickOpen = (id) => {
    setOpen2(true);
  };

  const handleClose2 = () => {
    setOpen2(false);
  };

  //  const handleDelete = async () => {
  //    const res = await axiosInstance.post(`/position/delete/${positionId}`, {token:user.data.token})
  //    if(res){
  //     const res1 = await axiosInstance.post("/position/fetchAll", {token:user.data.token})
  //     setPositions(res1.data.data)
  //    }
  //    setOpen2(false)
  //    setOpen(true)
  //    setSuccess(true)
  //  }


  const searchSelectChange = (e) => {
    const tailorObject = tailors.filter((data) => data._id == e.target.value);
    setTailor(tailorObject[0]);
  };

  const handleSearch = () => {
    const obj = {
      tailor: tailor['_id']
    };
    if (startDate.length > 0) {
      obj['startDate'] = startDate
    }
    if (endDate.length > 0) {
      obj['endDate'] = startDate
    }
    fetchJobs(obj);
    setTailorAdvance(tailor['advancePayment'])
  }

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      if (e.target.dataset.type == 'job') {
        jobIDArray.push(e.target.dataset.name)
        setJobIDArray([...jobIDArray])
      }
      // else if(e.target.dataset.type == 'extra'){
      //   extraPaymentsIDArray.push(e.target.dataset.name)
      //   setExtraPaymentsIDArray([...extraPaymentsIDArray])

      // }
      setCostChk([...costChk, Number(e.target.value)]);
      const subT = Number(subTotal) + Number(e.target.value)
      setSubTotal(subT)
      const totP = (subT + manualBill + rent) - deductedAdvance
      setTotalPay(totP)

    } else {
      if (e.target.dataset.type == 'job') {
        const jobIDs = jobIDArray.filter((id) => id !== e.target.dataset.name)
        setJobIDArray(jobIDs)
      }
      // else{
      //   const extraPaymentsIDs = extraPaymentsIDArray.filter((id) => id !== e.target.dataset.name)
      //   setExtraPaymentsIDArray(extraPaymentsIDs)
      // }
      const updatedSelectedItem = costChk.filter(
        (selectedItem) => selectedItem !== Number(e.target.value)
      );
      const subT = Number(subTotal) - Number(e.target.value)
      setSubTotal(subT)
      setCostChk(updatedSelectedItem);
      const totP = subT - deductedAdvance + manualBill + rent
      setTotalPay(totP)
    }
  };

  const handleCheckAllJobs = (e) => {
    if (e.target.checked) {
      let cost = 0
      const jobArrayID = []
      const costArray = []
      for (let x of jobs) {
        if (x['extraPayments'].length > 0) {
          jobArrayID.push(x['_id'])
          cost = Number(cost) + Number(x['cost'])
          for (let y of x['extraPayments']) {
            if (y['status'] == true && y['approved'] == true) {
              cost = Number(cost) + Number(y['cost'])
            }
          }
          costArray.push(x['cost'])
        } else {
          jobArrayID.push(x['_id'])
          costArray.push(x['cost'])
          cost = Number(cost) + Number(x['cost'])
        }
      }
      setCostChk(costArray)
      setJobIDArray(jobArrayID)

      setSubTotal(Number(cost))
      const totP = (Number(cost) + manualBill + rent) - deductedAdvance
      setTotalPay(totP)
    } else {
      setJobIDArray([])
      setSubTotal(0)
      const totP = (0 + manualBill + rent) - deductedAdvance
      setTotalPay(totP)
    }
  }

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSuccess(false);
    setOpen(false);
  };

  const handleDeductAdvance = (e) => {
    if (!costChk.length > 0) {
      setError(true)
      setSuccess(false)
      setErrorMsg("Please Select an Order First !.")
    }
    else {
      if (Number(e.target.value) > tailorAdvance) {
        setError(true)
        setSuccess(false)
        setErrorMsg("Deducted advance cannot be more than total Advance !.")
      } else {
        setDeductedAdvance(Number(e.target.value))
        const totP = (Number(subTotal) + Number(manualBill) + Number(rent)) - Number(e.target.value)
        setTotalPay(totP)
      }
    }
  }

  const handleManualBill = (e) => {
    if (!costChk.length > 0) {
      setError(true)
      setSuccess(false)
      setErrorMsg("Please Select an Order First !.")
    }
    else {
      setManualBill(Number(e.target.value))
      const totP = (Number(subTotal) + Number(e.target.value) + Number(rent)) - Number(deductedAdvance)
      setTotalPay(totP)
    }
  }

  const handleRent = (e) => {
    if (!costChk.length > 0) {
      setError(true)
      setSuccess(false)
      setErrorMsg("Please Select an Order First !.")
    }
    else {
      setRent(Number(e.target.value))
      const totP = (Number(subTotal) + Number(e.target.value) + Number(manualBill)) - Number(deductedAdvance)
      setTotalPay(totP)
    }
  }

  const handleSubmitPayment = async (e) => {
    if (totalPay > 0) {
      let paymentObj = {
        deductedAdvance: deductedAdvance,
        subTotal: subTotal,
        totalPay: totalPay,
        tailorAdvance: tailorAdvance,
        manualBill: manualBill,
        rent: rent,
        tailor: tailor['_id'],
        job: jobIDArray,
        // extraPaymentCategory: extraPaymentsIDArray
      }

      if (jobIDArray.length > 0) {
        for (let x of jobIDArray) {
          let updateObject = {
            paid: true,
            paidDate: Date.now()
          }
          const res = await axiosInstance.put('/job/update/' + x, { token: user.data.token, job: updateObject })
          if (res.data.status == true) {
            setError(false)
            setSuccess(true)
            setSuccessMsg(res.data.message)
          } else {
            setError(true)
            setSuccess(false)
            setErrorMsg(res.data.message)
          }
        }
      }

      // if(extraPaymentsIDArray.length > 0){
      //   for(let x of extraPaymentsIDArray){
      //     let yupdateObject = {
      //       paid: true,
      //       paidDate: Date.now()
      //     }
      //     const res = await axiosInstance.put('/workerExtraPayments/update/' + x, {token: user.data.token, extraPayment: yupdateObject})
      //     if(res.data.status == true){
      //       setError(false)
      //       setSuccess(true)
      //       setSuccessMsg(res.data.message)
      //     }else{
      //       setError(true)
      //       setSuccess(false)
      //       setErrorMsg(res.data.message)
      //     }
      //   }
      // }

      const advp = Number(tailor['advancePayment']) - Number(deductedAdvance)
      const obj = {
        advancePayment: advp
      }

      updateTailor(obj)

      createPayment(paymentObj)


    }
  }

  const exportPDF = async (jobType, job_id) => {

    let ArrayPDF = {}
    if (jobType == 'job') {
      const jobArr = jobs.filter((job) => job['_id'] == job_id)
      ArrayPDF = jobArr[0]
    }


    if (ArrayPDF['extraPayments'].length > 0) {
      for (let x of ArrayPDF['extraPayments']) {
        const category = extraPaymentCategories.filter((single) => single['_id'] == x['extraPaymentCategory'])
        x['nameOfCategory'] = category[0]['name']
      }
    }



    let totalCost = ArrayPDF['cost']
    let htmlElement = (
      <div style={{ width: "290mm", margin: "0 auto", padding: "10px" }}>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div className="logo" style={{ width: "100px", margin: "0 auto" }}>
            <img src={Logo} alt="Logo" style={{ width: "50px" }} />
            <h4 style={{ margin: 0 }}>Siam Suits Supply</h4>
          </div>
          <div className="qr" style={{ width: "100px", margin: "10px auto" }}>
            <img src={mainQR} alt="QR Code" style={{ width: "50px" }} />
          </div>
        </div>

        <div style={{ fontSize: "12px" }}>
          <div style={{ marginBottom: "5px" }}>
            <strong>Name:</strong> {ArrayPDF['tailor']['firstname']} {ArrayPDF['tailor']['lastname']}
          </div>
          <div style={{ marginBottom: "5px" }}>
            <strong>Date:</strong> {new Date(ArrayPDF['date']).toLocaleDateString()}
          </div>
          <div style={{ marginBottom: "5px" }}>
            <strong>Order No.:</strong> {ArrayPDF['order_id'] ? ArrayPDF['order_id']['orderId'] : ArrayPDF['group_order_id']['orderId']}
          </div>
        </div>

        <div style={{ fontSize: "12px", marginTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <strong>Category</strong>
            <strong>Price</strong>
          </div>
          <div style={{ textTransform: "capitalize" }}>
            {ArrayPDF['process']['name']} <span>{ArrayPDF['cost']}</span>
          </div>

          {ArrayPDF['extraPayments'].length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <strong>Extra Category</strong>
                <strong>Price</strong>
              </div>
              {ArrayPDF['extraPayments'].map((single) => (
                single['approved'] && single['status'] !== false && (
                  <div key={single.nameOfCategory} style={{ textTransform: "capitalize" }}>
                    {single.nameOfCategory} <span>{single.cost}</span>
                  </div>
                )
              ))}
            </>
          )}

          {ArrayPDF['stylingprice'] && Object.keys(ArrayPDF['stylingprice']).length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <strong>Stylings</strong>
                <strong>Price</strong>
              </div>
              {Object.keys(ArrayPDF['stylingprice']).map((single) => (
                <div key={single} style={{ textTransform: "capitalize" }}>
                  {single} <span>{ArrayPDF['stylingprice'][single]}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <strong>Total:</strong>
            <span>{totalCost}</span>
          </div>
        </div>
      </div>
      // <>
      //   <div style={{ width: "800px", marginLeft: '250px', marginRight: '250px', position: 'relative' }}>
      //     <div style={{ width: "800px", margin: 'auto' }}>
      //       <div className="logo" style={{ width: "200px", position: 'relative', textAlign: 'center' }}>
      //         <img src={Logo} style={{ width: "80px" }} />
      //         <h4 style={{ margin: "0", display: 'block', position: 'relative' }}>Siam Suits Supply</h4>
      //       </div>
      //       <div className="qr" style={{ width: "200px", position: 'relative', textAlign: 'center' }}>
      //         <img src={mainQR} style={{ width: "80px" }} />
      //       </div>
      //       <div style={{ width: '600px', position: 'relative', fontSize: "14px" }}>
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px' }}>Name: <span style={{ marginLeft: '50px' }}>{ArrayPDF['tailor']['firstname'] + " " + ArrayPDF['tailor']['lastname']}</span></div>
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px' }}>Date: <span style={{ marginLeft: '50px' }}>{new Date(ArrayPDF['date']).toLocaleDateString()}</span></div>
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px' }}>Order No.: <span style={{ marginLeft: '50px' }}>{ArrayPDF['order_id'] ? ArrayPDF['order_id']['orderId'] : ArrayPDF['group_order_id']['orderId']}</span></div>
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px', fontSize: "12px" }}><strong>Category</strong> <span style={{ marginLeft: '50px' }}><strong>Price</strong></span></div>
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px', textTransform: "capitalize", fontSize: "12px" }}>{ArrayPDF['process']['name']} <span style={{ marginLeft: '50px' }}>{ArrayPDF['cost']}</span></div>
      //         {ArrayPDF['extraPayments'].length > 0
      //           ?
      //           <>
      //             <div className="qr-detail"><strong>Extra Category</strong> <span style={{ marginLeft: '50px' }}><strong>Price</strong></span></div>
      //             {
      //               ArrayPDF['extraPayments'].map((single) => {
      //                 if (single['approved'] == true && single['status'] !== false) {
      //                   totalCost = totalCost + single.cost
      //                   return (
      //                     <div className="qr-detail" style={{ textTransform: "capitalize", fontSize: "12px" }}>{single.nameOfCategory} <span style={{ marginLeft: '50px' }}>{single.cost}</span></div>
      //                   )
      //                 }
      //               })
      //             }
      //           </>
      //           :
      //           <></>}
      //         {
      //           ArrayPDF['stylingprice'] && Object.keys(ArrayPDF['stylingprice']).length > 0
      //             ?
      //             <>
      //               <div className="qr-detail"><strong>Stylings</strong> <span style={{ marginLeft: '50px' }}><strong>Price</strong></span></div>
      //               {
      //                 Object.keys(ArrayPDF['stylingprice']).map((single) => {
      //                   totalCost = totalCost + ArrayPDF['stylingprice'][single]
      //                   return (
      //                     <div className="qr-detail" style={{ textTransform: "capitalize" }}>{single} <span style={{ marginLeft: '50px' }}>{ArrayPDF['stylingprice'][single]}</span></div>
      //                   )
      //                 })
      //               }
      //             </>
      //             :
      //             <></>
      //         }
      //         {/* <div className="qr-detail"><strong>Extra Category</strong> <span style={{marginLeft:'50px'}}><strong>Price</strong></span></div> 
      //       <div className="qr-detail">HIDDEN POCKET <span style={{marginLeft:'50px'}}>10</span></div>  */}
      //         <div className="qr-detail" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '200px' }}><span style={{ marginLeft: '50px' }}><strong>Total : {totalCost}</strong></span></div>
      //         {/* <div className="qr-detail"  style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}><strong>Authorized by</strong> <span style={{marginLeft:'50px'}}>s</span></div> */}
      //       </div>
      //     </div>
      //   </div>
      // </>
    )

    // let html2 = (
    //   <>
    //   <div style={{ width: "800px", marginLeft:'250px', marginRight:'250px', position:'relative'}}>
    //       <div style={{ width: "800px", margin:'auto'}}>
    //         <div className="logo" style={{ width: "200px", position:'relative', textAlign:'center'}}>
    //          <img src={Logo} style={{width:"80px"}}/>
    //          <h2 style={{margin:"0", display:'block', position:'relative'}}>Siam Suits Supply</h2>
    //         </div>
    //         <div className="qr" style={{width: "200px", position:'relative', textAlign:'center'}}>
    //          <img src={mainQR} style={{width:"80px"}}/>
    //         </div>
    //         <div style={{width:'600px', position:'relative'}}>
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}>Name: <span>Aon Pant</span></div>
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}>Date: <span>28/Mar/2023</span></div>
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}>Order No.: <span>dan-11367</span></div>
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}><strong>Category</strong> <span><strong>Price</strong></span></div> 
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}>Pants Sewing <span>200</span></div> 
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}><strong>Extra Category</strong> <span><strong>Price</strong></span></div> 
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}>HIDDEN POCKET <span>10</span></div> 
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}><span style={{marginLeft:'90px'}}><strong>Total : 230.00</strong></span></div>
    //         <div className="qr-detail" style={{position:'relative', display:'flex', justifyContent:'space-between', width:'200px' }}><strong>Authorized by</strong> <span>s</span></div>
    //       </div>
    //       </div>
    //     </div></>
    // )
    let elementAsString = renderToString(htmlElement);
    let doc = new jsPDF('p', 'px', [794, 1123]);
    doc.html(elementAsString, {
      callback: function (doc) {
        window.open(doc.output('bloburl'), '_blank');
      },
      x: 10,
      y: 10,
    });
  }

  // const generatePDF = (jobType, job_id) => {
  //   let ArrayPDF = {}
  //   if (jobType == 'job') {
  //     const jobArr = jobs.filter((job) => job['_id'] == job_id)
  //     ArrayPDF = jobArr[0]
  //   }
    


  //   if (ArrayPDF['extraPayments'].length > 0) {
  //     for (let x of ArrayPDF['extraPayments']) {

  //       const category = extraPaymentCategories.filter((single) => single['_id'] == x['extraPaymentCategory'])
  //       x['nameOfCategory'] = category[0]['name']
  //       if(category[0]['thai_name']){
  //         x['thai_catergory_name'] = category[0]['thai_name']
  //       }
  //     }
  //   }
  //   console.log(ArrayPDF)

  //   let totalCost = ArrayPDF['cost']
  //   if (ArrayPDF['extraPayments'].length > 0) {
  //     for (let x of ArrayPDF['extraPayments']) {

  //       if (x['approved'] && x['status'] !== false) {
  //         totalCost = totalCost + x.cost;
  //       }
  //     }
  //   }
  //   const doc = new jsPDF({
  //     orientation: 'portrait',
  //     unit: 'mm',
  //     format: [80, 290], // width: 80mm, height: 290mm
  //   });

  //   function toTitleCase(text) {
  //     return text
  //       .toLowerCase() // Convert all text to lowercase first
  //       .split(' ') // Split the text into words
  //       .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
  //       .join(' '); // Join the words back into a string
  //   }

  //   // Add logo with reduced space above
  //   doc.addImage(Logo, 'PNG', 25, 2, 30, 10); // Reduced space from the top

  //   // Header text
  //   doc.setFontSize(12);
  //   // doc.text('Siam Suits Supply', 40, 22, { align: 'center' }); // Adjusted y-position for tighter spacing

  //   // QR code and main order info with reduced line height
  //   doc.addImage(mainQR, 'PNG', 30, 17, 20, 20);
  //   doc.setFontSize(10);
  //   doc.text(`Name: ${ArrayPDF['tailor']['firstname']} ${ArrayPDF['tailor']['lastname']}`, 5, 45);  // Move text up slightly
  //   doc.text(`Date: ${new Date(ArrayPDF['date']).toLocaleDateString()}`, 5, 51);  // Reduced line height
  //   doc.text(`Order No.: ${ArrayPDF['order_id'] ? ArrayPDF['order_id']['orderId'] : ArrayPDF['group_order_id']['orderId']}`, 5, 57); // Reduced line height

  //   // Order Details Section
  //   doc.setFontSize(10);
  //   doc.setFont('helvetica', 'bold');
  //   doc.text('Category', 5, 67);  // Adjusted position
  //   doc.text('Price', 65, 67, { align: 'right' });


  //   doc.setFont('helvetica', 'normal');

  //   doc.text(`${toTitleCase(ArrayPDF['process']['name'])}`, 5, 75);
    
  //   let yPos = 85;

  //   // if(ArrayPDF['process']['thai_name']){
  //   //   // doc.setFont('THSarabunNew');
    
  //   //   doc.text(ArrayPDF['process']['thai_name'], 5, yPos);
  //   //   yPos += 5; // Tighter line height (5 instead of 7)
  //   // }
    
  //   doc.setFont('helvetica','normal');
  //   doc.text(`${ArrayPDF['cost']}`, 65, 75, { align: 'right' });


  //   if (ArrayPDF['extraPayments'].length > 0) {

  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Extra Category', 5, yPos);  // Adjusted position
  //     doc.text('Price', 65, yPos, { align: 'right' });

  //     doc.setFont('helvetica', 'normal');
  //     yPos += 7
  //     ArrayPDF['extraPayments'].forEach((item) => {
  //       if (item['approved'] && item['status'] !== false) {
  //         doc.text(toTitleCase(item.nameOfCategory), 5, yPos);
  //         doc.text(String(item.cost), 65, yPos, { align: 'right' });
  //         yPos += 5; // Tighter line height (5 instead of 7)
  //         if(item['thai_category_name']){
  //           doc.text(item.thai_category_name, 5, yPos);
  //           yPos += 5; // Tighter line height (5 instead of 7)
  //         }
  //       }
  //     });
  //   }


  //   if (ArrayPDF['stylingprice'] && Object.keys(ArrayPDF['stylingprice']).length > 0) {

  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Stylings', 5, yPos);  // Adjusted position
  //     doc.text('Price', 65, yPos, { align: 'right' });

  //     doc.setFont('helvetica', 'normal');
  //     yPos += 7
  //     Object.keys(ArrayPDF['stylingprice']).forEach((item) => {
  //       if (item['approved'] && item['status'] !== false) {
  //         doc.text(item, 5, yPos);
  //         doc.text(String(ArrayPDF['stylingprice'].item), 65, yPos, { align: 'right' });
  //         yPos += 5; // Tighter line height (5 instead of 7)
  //       }
  //     });
  //   }


  //   // Total Section
    
  //   doc.setFont('helvetica', 'bold');
  //   doc.setFontSize(12);
  //   doc.text('Total:', 5, yPos + 5);
  //   doc.text(String(totalCost), 65, yPos + 5, { align: 'right' });

  //   // Save the PDF and open as Blob URL
  //   const pdfBlob = doc.output('blob');
  //   const blobUrl = URL.createObjectURL(pdfBlob);
  //   window.open(blobUrl);



  // };


  const generatePDF = (jobType, job_id) => {
    let ArrayPDF = {};
    if (jobType === 'job') {
      const jobArr = jobs.filter(job => job['_id'] === job_id);
      ArrayPDF = jobArr[0];
    }
    
    // Process extra payments
    if (ArrayPDF['extraPayments']?.length > 0) {
      for (let x of ArrayPDF['extraPayments']) {
        const category = extraPaymentCategories.find(single => single['_id'] === x['extraPaymentCategory']);
        if (category) {
          x['nameOfCategory'] = category['name'];
          if (category['thai_name']) {
            x['thai_category_name'] = category['thai_name']; // Fixed typo
          }
        }
      }
    }
    
    console.log(ArrayPDF);
    
    // Calculate total cost
    let totalCost = ArrayPDF['cost'] || 0;
    if (ArrayPDF['extraPayments']?.length > 0) {
      for (let x of ArrayPDF['extraPayments']) {
        if (x['approved'] && x['status'] !== false) {
          totalCost += x.cost;
        }
      }
    }
    
    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 290],
    });
    
    function toTitleCase(text) {
      return text?.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') || '';
    }
    
    // Logo
    doc.addImage(Logo, 'PNG', 25, 2, 30, 10);
    
    // Order Info
    doc.setFontSize(10);
    doc.text(`Name: ${ArrayPDF?.tailor?.firstname || ''} ${ArrayPDF?.tailor?.lastname || ''}`, 5, 45);
    doc.text(`Date: ${new Date(ArrayPDF?.date).toLocaleDateString()}`, 5, 51);
    doc.text(`Order No.: ${ArrayPDF?.order_id?.orderId || ArrayPDF?.group_order_id?.orderId || ''}`, 5, 57);
    
    // Category
    doc.setFont('helvetica', 'bold');
    doc.text('Category', 5, 67);
    doc.text('Price', 65, 67, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${toTitleCase(ArrayPDF?.process?.name)}`, 5, 75);
    doc.text(`${ArrayPDF?.cost || 0}`, 65, 75, { align: 'right' });
    
    let yPos = 85;
    
    // Extra Payments
    if (ArrayPDF['extraPayments']?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Extra Category', 5, yPos);
      doc.text('Price', 65, yPos, { align: 'right' });
    
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    
      ArrayPDF['extraPayments'].forEach((item) => {
        if (item['approved'] && item['status'] !== false) {
          doc.text(toTitleCase(item.nameOfCategory), 5, yPos);
          doc.text(String(item.cost), 65, yPos, { align: 'right' });
          yPos += 5;
    
          if (item['thai_category_name']) {
            doc.text(item['thai_category_name'], 5, yPos);
            yPos += 5;
          }
        }
      });
    }
    
    // Styling Price
    if (ArrayPDF['stylingprice'] && Object.keys(ArrayPDF['stylingprice']).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Stylings', 5, yPos);
      doc.text('Price', 65, yPos, { align: 'right' });
    
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    
      Object.entries(ArrayPDF['stylingprice']).forEach(([key, value]) => {
        doc.text(toTitleCase(key), 5, yPos);
        doc.text(String(value), 65, yPos, { align: 'right' });
        yPos += 5;
      });
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 5, yPos + 5);
    doc.text(String(totalCost), 65, yPos + 5, { align: 'right' });
    
    // Open in popup window
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const popup = window.open("", "pdfPopup", "width=800,height=600");
    
    if (popup) {
      popup.document.write(`
        <html>
          <head><title>PDF Preview</title></head>
          <body style="margin:0">
            <embed width="100%" height="100%" src="${blobUrl}" type="application/pdf" />
          </body>
        </html>
      `);
    } else {
      alert("Popup blocked! Please allow popups for this site.");
    }
    


  };
  const handleAddQrCode = (e) => {
    if (!qrCode.length > 0) {
      setError(true)
      setSuccess(false)
      setErrorMsg("QR Code string cant be empty!")
    }
    else {
      const job = jobs.filter((jb) => jb['_id'] == qrCode)
      if (!job.length > 0) {
        setError(true)
        setSuccess(false)
        setErrorMsg("Not a Valid Code!")
      } else {
        if (jobIDArray.includes(qrCode)) {
          setError(true)
          setSuccess(false)
          setErrorMsg("Already Selected!")
        } else {
          if (job[0]['extraPayments'].length > 0) {
            jobIDArray.push(qrCode)
            setJobIDArray([...jobIDArray])
            let costTotal = Number(job[0]['cost'])
            for (let x of job[0]['extraPayments']) {
              if (x['approved'] == true && x['status'] == true) {
                costTotal = costTotal + Number(x['cost'])
              }
            }
            const subT = Number(subTotal) + Number(costTotal)
            setSubTotal(subT)
            const totP = (subT + manualBill + rent) - deductedAdvance
            setTotalPay(totP)
          } else {
            jobIDArray.push(qrCode)
            setJobIDArray([...jobIDArray])
            setCostChk([...costChk, Number(job[0]['cost'])]);
            const subT = Number(subTotal) + Number(job[0]['cost'])
            setSubTotal(subT)
            const totP = (subT + manualBill + rent) - deductedAdvance
            setTotalPay(totP)
          }
          setQrCode("")
        }
      }
    }
  }

  const handleSelectJob = (jobType, job_id) => {
    setJobId(job_id)
    setShowRetailers(true)
  }
  const handleOpenDeleteDialog = (e) => {
    setJobId(e.target.dataset.jobid)
    setOpenDeleteDialog(true)
  }
  const handleDeleteJob = (e) => {
    deleteJobs(jobId)
  }

  const handleEditJob = async (e) => {
    const par = {
      tailor: e.target.dataset.tailorid
    }
    updateJobsForWorkers(par)
  }



  // ======================================================================
  // ========================== static function ===========================
  // ======================================================================

  const fetchJobs = async (par = null) => {
    par['paid'] = false
    // par['status'] = true
    const res = await axiosInstance.post("/job/fetchAll", {
      token: user.data.token,
      par: par,
    });

    if (res.data.status == true) {
      if (startDate.length > 0 && !endDate.length > 0) {
        const jobsArray = res.data.data.filter((job) => job.date > new Date(startDate).getTime())
        setJobs(jobsArray)
        setShowJobs(true);
      }
      if (!startDate.length > 0 && endDate.length > 0) {
        const jobsArray = res.data.data.filter((job) => job.date < new Date(endDate).getTime())
        setJobs(jobsArray)
        setShowJobs(true);
      }
      if (startDate.length > 0 && endDate.length > 0) {
        const jobsArray = res.data.data.filter((job) => {
          return new Date(startDate).getTime() < job.date && job.date < new Date(endDate).getTime()
        })
        setJobs(jobsArray)
        setShowJobs(true);
      }
      if (!startDate.length > 0 && !endDate.length > 0) {
        setJobs(res.data.data)
        setShowJobs(true);
      }
    } else {
      setShowJobs(false);
      setJobs([]);
    }

  };

  const fetchTailors = async () => {
    const res = await axiosInstance.post("/tailer/fetchAll", {
      token: user.data.token,
    });
    setTailors(res.data.data);
  };

  const updateTailor = async (data) => {
    const res = await axiosInstance.put("/tailer/update/" + tailor['_id'], { token: user.data.token, tailer: data })
    if (res.data.status == true) {
      const obj = {
        tailor: tailor['_id']
      };
      if (startDate.length > 0) {
        obj['startDate'] = startDate
      }
      if (endDate.length > 0) {
        obj['endDate'] = startDate
      }

      // const obj2 = {
      //   tailor: tailor['_id'],
      //   approved: true,
      //   paid: false
      // }
      // fetchExtraPayments(obj2)
      fetchJobs(obj)
      setSubTotal(0)
      setDeductedAdvance(0)
      setTailorAdvance(data['advancePayment'])
      setManualBill(0)
      setCostChk([])
      setJobIDArray([])
      setTotalPay(0)

      setError(false)
      setSuccess(true)
      setSuccessMsg(res.data.message)
    } else {
      setError(true)
      setSuccess(false)
      setErrorMsg(res.data.message)
    }
  }

  const createPayment = async (data) => {
    const res = await axiosInstance.post('/payments/create', { token: user.data.token, payment: data })
    if (res.data.status == true) {
      setError(false)
      setSuccess(true)
      setSuccessMsg(res.data.message)
    } else {
      setError(true)
      setSuccess(false)
      setErrorMsg(res.data.message)
    }
  }

  const fetchExtraPaymentCategories = async () => {
    const res = await axiosInstance.post('/extraPaymentCategory/fetchAll', { token: user.data.token })
    if (res.data.status == true) {
      setExtraPaymentCategories(res.data.data)
    }
  }

  const updateJobsForWorkers = async (par = null) => {
    const res = await axiosInstance.put("/job/updateWorker/" + jobId, {
      token: user.data.token,
      par: par
    })
    if (res.data.status == true) {
      handleSearch()
      setShowRetailers(false)
      setError(false)
      setSuccess(true)
      setSuccessMsg(res.data.message)
    } else {
      setError(true)
      setSuccess(false)
      setErrorMsg(res.data.message)
    }
  }

  const deleteJobs = async (par = null) => {
    const res = await axiosInstance.delete("/job/" + jobId, {
      token: user.data.token
    })
    if (res.data.status == true) {
      handleSearch()
    }
  }
  // ======================================================================
  // ======================================================================
  // ======================================================================

  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <main className="main-panel">
      <div className="content-wrapper">
        <div className="order-table manage-page">
          <div style={{ paddingTop: '20px', paddingLeft: '20px' }}>
            <strong>Payment Summary</strong>
          </div>
          <div className="top-heading-title" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: 'inline-flex' }}>
              <div className="searchinput-inner" >
                <p>Start Date</p>
                <input type="date" className="searchinput" onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="searchinput-inner" >
                <p>End Date</p>
                <input type="date" className="searchinput" onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: "center", justifyContent: "space-between"}}>
              <div className="searchinput-inner">
                <p>Worker Name</p>
                <select
                  name="workername"
                  id="retailer"
                  onChange={searchSelectChange}
                  className="searchinput"
                >
                  <option value=" ">Select Tailor</option>
                  {tailors.length > 0 && tailors !== null ? (
                    tailors.map((data, i) => (
                      <option
                        style={{ textTransform: "capitalize" }}
                        key={i}
                        value={data._id}
                      >
                        {data.firstname + " " + data.lastname + " " + data['thai_fullname']}
                      </option>

                    ))
                  ) : (
                    <></>
                  )}
                </select>
                <span style={{ marginLeft: "10px" }}>
                  <button type="button" className="custom-btn" onClick={handleSearch}> <i className="fa-solid fa-search"></i></button>
                </span>
              </div>
              {showJobs
                ?
                <div className="searchinput-inner">
                  <p>QR Code</p>
                  <input type="text" className="searchinput" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
                  <button className="btn-history2" onClick={handleAddQrCode} >Add</button>
                </div>
                :
                <></>
              }
              <div className="searchinput-inner" style={{marginTop: "30px", marginRight: "30px"}}>
                <p style={{fontSize: "20px", color: "black"}}>Total No. : {showJobs && jobs.length > 0 ? jobs.length : 0}</p>
              </div>
            </div>
          </div>
          {showJobs
            ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tailor</th>
                    <th>Item</th>
                    <th>Order</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Cost</th>
                    <th><input type="checkbox" onClick={handleCheckAllJobs} />Check All</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {showJobs
                    ?
                    jobs.map((job, index) => {
                      let costTotal = job.cost
                      let type = "Normal"

                      if (job['extraPayments'].length > 0) {
                        type = "Both";
                        for (let x of job['extraPayments']) {
                          if (x['approved'] == true && x['status'] !== false) {
                            costTotal = costTotal + Number(x['cost'])
                          }
                        }
                      }
                      if (job['stylingprice']) {
                        let stylingNum = 0;
                        for (let x of Object.values(job['stylingprice'])) {
                          stylingNum = stylingNum + Number(x)
                        }
                        costTotal = costTotal + stylingNum
                      }
                      return (
                        <tr key={job['_id']}>
                          <td>
                            <span >{job.tailor.firstname + " " + job.tailor.lastname}</span>

                          </td>
                          <td style={{ textTransform: "capitalize" }}>
                            {
                              job.item_code.split("/")[1].split("_")[0] == 'suit'
                                ?
                                Number(job.item_code.split("/")[1].split("_")[2]) +
                                1 +
                                " " +
                                job.item_code.split("/")[1].split("_")[1]
                                +
                                " ("
                                +
                                job.item_code.split("/")[1].split("_")[0]
                                +
                                ")"
                                :
                                job.item_code.split("/")[1].split("_")[0] == 'tuxedo'
                                ?
                                Number(job.item_code.split("/")[1].split("_")[2]) +
                                1 +
                                " " +
                                job.item_code.split("/")[1].split("_")[1]
                                +
                                " ("
                                +
                                job.item_code.split("/")[1].split("_")[0]
                                +
                                ")"
                                :
                                Number(job.item_code.split("/")[1].split("_")[1]) +
                                1 +
                                " " +
                                job.item_code.split("/")[1].split("_")[0]
                            }
                          </td>
                          <td>{job.order_id ? job.order_id.orderId : job.group_order_id.orderId}</td>
                          <td style={{ textTransform: "capitalize" }}>
                            {job.process["name"]}
                          </td>
                          <td>{type}</td>
                          <td>{costTotal}</td>
                          <td>
                            <input
                              type="checkbox"
                              value={costTotal}
                              data-type="job"
                              data-name={job['_id']}
                              checked={jobIDArray.includes(job['_id']) ? true : false}
                              onChange={(e) => handleCheckboxChange(e)}
                            />
                          </td>
                          <td>
                            <span><EditIcon onClick={(e) => { handleSelectJob("job", job['_id']) }} style={{ marginRight: "5px", color: "#1C4D8F", fontSize: "20px", cursor: "pointer" }} /></span>
                            <span><PrintIcon onClick={(e) => { generatePDF("job", job['_id']); }} style={{ marginRight: "5px", color: "#1C4D8F", fontSize: "20px", cursor: "pointer" }} /></span>

                          </td>
                        </tr>
                      );
                    })
                    :
                    <></>}

                  {/* {showWorkerExtraPayments
                ?
                workerExtraPayments.map((extraPayment) => {
                  return (
                    <tr>
                      <td>
                        {extraPayment.tailor.firstname + " " + extraPayment.tailor.lastname}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {
                        extraPayment.item_code.split("/")[1].split("_")[0] == 'suit'
                        ?
                        Number(extraPayment.item_code.split("/")[1].split("_")[2]) +
                        1 +
                        " " +
                        extraPayment.item_code.split("/")[1].split("_")[1]
                        + 
                        " ("
                        +
                        extraPayment.item_code.split("/")[1].split("_")[0]
                        +
                        ")"
                        :
                        Number(extraPayment.item_code.split("/")[1].split("_")[1]) +
                          1 +
                          " " +
                          extraPayment.item_code.split("/")[1].split("_")[0]}
                      </td>
                      <td>{extraPayment.order_id.orderId}</td>
                      <td style={{ textTransform: "capitalize" }}>
                        {extraPayment.extraPaymentCategory["name"]}
                      </td>
                      
                      <td>Extra</td>
                      <td>{extraPayment.extraPaymentCategory["cost"]}</td>
                      <td>
                        <input
                          type="checkbox"
                          value={extraPayment.extraPaymentCategory["cost"]}
                          data-type = "extra"
                          data-name = {extraPayment['_id']}
                          onChange={(e) => handleCheckboxChange(e)}
                        />
                      </td>
                      
                      <td>
                        <button data-type="extra" data-id={extraPayment['_id']} onClick={exportPDF} className="custom-btn-new" >Reprint</button>
                      </td>
                    </tr>
                  )
                })
              :
              <></>
              } */}
                </tbody>
              </table>
            ) : (
              <div>No Jobs Found!</div>
            )}
          <div className="invoice-form-NM bottomINput">
            <form>
              <div
                className="from-group f"
                style={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  alignItems: "end",
                  margin: "0 -15px",
                }}
              >
                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>รวม (Subtotal)</p>
                  <input
                    // disabled={true}
                    type="text"
                    className="searchinput"
                    value={subTotal}
                  />
                </div>
                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>ยอดรวมเบิก (Total Advance)</p>
                  <input
                    type="text"
                    className="searchinput"
                    value={tailorAdvance}
                  />
                </div>
                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>หักคราวนี้ (Deduct Advance)</p>
                  <input
                    type="text"
                    className="searchinput"
                    value={deductedAdvance}
                    onChange={handleDeductAdvance}
                  />
                </div>

                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>ค่าห้อง (Rent)</p>
                  <input
                    type="text"
                    className="searchinput"
                    value={rent}
                    onChange={handleRent}
                  />
                </div>
                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>บิลอื่น (Manual Bill)</p>
                  <input
                    // disabled={true}
                    type="text"
                    className="searchinput"
                    value={manualBill}
                    onChange={handleManualBill}
                  />
                </div>
                <div className="searchinput-inner" style={{ display: "inline-flex", justifyContent: "space-between" }}>
                  <p style={{ minWidth: "200px" }}>ยอดจ่ายวันนี้ (Total Pay Today)</p>
                  <input
                    // disabled={true}
                    type="text"
                    className="searchinput"
                    value={totalPay}
                  />
                </div>
                <div className="searchinput-inner">
                  <Button
                    className="custom-btn"
                    onClick={handleSubmitPayment}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Dialog
        open={open2}
        onClose={handleClose2}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmation?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose2}>Cancel</Button>
          {/* <Button onClick={handleDelete} autoFocus>
                    Yes
                    </Button> */}
        </DialogActions>
      </Dialog>
      <Dialog
        open={showRetailers}
        onClose={() => setShowRetailers(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Please select a worker?"}</DialogTitle>
        <div>
          {tailors.length > 0 && tailors !== null ? (
            tailors.map((data, i) => (
              <li
                style={{ textTransform: "capitalize" }}
                key={i}
                value={data._id}
                data-tailorid={data._id}
                onClick={handleEditJob}
                className="workerListBox"
              >
                {data.firstname + " " + data.lastname + " " + data['thai_fullname']}
              </li>
            ))
          ) : (
            <></>
          )}
        </div>
        <DialogActions>
          <Button onClick={() => setShowRetailers(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete this job?"}</DialogTitle>
        <div style={{ padding: "0 25px" }}>
          <p>Are you sure you want to delete this Job ?</p>
        </div>
        <DialogActions>
          <button className="custom-btn-new" onClick={() => handleDeleteJob()}>Delete</button>
          <button className="custom-btn-new" onClick={() => setOpenDeleteDialog(false)}>Cancel</button>
        </DialogActions>
      </Dialog>

      {success && (
        <Snackbar open={success} autoHideDuration={2000} onClose={handleClose}>
          <Alert
            onClose={handleClose}
            severity="success"
            sx={{ width: "100%" }}
          >
            {successMsg}
          </Alert>
        </Snackbar>
      )}
      {error && (
        <Snackbar open={error} autoHideDuration={2000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
            {errorMsg}
          </Alert>
        </Snackbar>
      )}
    </main>
  );
}
