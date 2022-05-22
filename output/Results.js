/* eslint-disable max-len */
import React, {useState, useEffect, useCallback} from "react";
import clsx from "clsx";
import PropTypes from "prop-types";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  SvgIcon,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  makeStyles,
} from "@material-ui/core";
import ArrowRightAltIcon from "@material-ui/icons/ArrowRightAlt";
import {
  Search as SearchIcon,
  Check as CheckIcon,
  Printer as PrinterIcon,
} from "react-feather";
import {deletePicklist} from "src/actions/picklistActions";
import {useDispatch} from "react-redux";
import {useSnackbar} from "notistack";
import printer from "./printer";

const tabs = [
  {
    value: "all",
    label: "All",
  },
];

const sortOptions = [
  {
    value: "created_at|desc",
    label: "Last create (newest first)",
  },
  {
    value: "created_at|asc",
    label: "Last create (oldest first)",
  },
];

function applyFilters(picklists, query, filters) {
  return picklists.filter((picklist) => {
    let matches = true;

    if (query) {
      const properties = ["name"];
      let containsQuery = false;

      properties.forEach((property) => {
        if (picklist[property].toLowerCase().includes(query.toLowerCase())) {
          containsQuery = true;
        }
      });

      if (!containsQuery) {
        matches = false;
      }
    }

    Object.keys(filters).forEach((key) => {
      const value = filters[key];

      if (value && picklist[key] !== value) {
        matches = false;
      }
    });

    return matches;
  });
}

function applyPagination(picklists, page, limit) {
  return picklists.slice(page * limit, page * limit + limit);
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }

  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySort(picklists, sort) {
  const [orderBy, order] = sort.split("|");
  const comparator = getComparator(order, orderBy);
  const stabilizedThis = picklists.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    // eslint-disable-next-line no-shadow
    const order = comparator(a[0], b[0]);

    if (order !== 0) return order;

    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}

const useStyles = makeStyles((theme) => ({
  root: {},
  queryField: {
    width: 500,
  },
  bulkOperations: {
    position: "relative",
  },
  bulkActions: {
    paddingLeft: 4,
    paddingRight: 4,
    marginTop: 6,
    position: "absolute",
    width: "100%",
    zIndex: 2,
    backgroundColor: theme.palette.background.default,
  },
  bulkAction: {
    marginLeft: theme.spacing(2),
  },
  avatar: {
    height: 42,
    width: 42,
    marginRight: theme.spacing(1),
  },
  header_pagination: {
    display: "flex",
    marginLeft: "-10px",
  },
  flexText: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  smallFlex: {
    display: "flex",
    flexDirection: "column",
  },
  smallFlexInvi: {
    display: "flex",
    flexDirection: "column",
    color: "transparent",
  },
  outsideDialog: {
    // width:
  },
  dialogContainer: {
    padding: "20px 40px",
  },
  smallMargin: {
    marginBottom: "15px",
  },
  bigTitle: {
    marginBottom: "20px",
  },
  smallTitle: {
    fontWeight: "bold",
    fontSize: "1.3em",
  },
  pictureFrame: {
    width: "250px",
    height: "150px",
    border: "1px solid grey",
  },
  smallPictureFrame: {
    width: "180px",
    height: "120px",
  },
  alignCenter: {
    alignItems: "center",
  },
  justifyCenter: {
    justifyContent: "center",
  },
  imageStyle: {
    width: "100%",
    height: "100%",
  },
  bigIcon: {
    justifyContent: "center",
    fontSize: "8em",
  },
  displayFlex: {
    display: "flex",
  },
  marginLeft: {
    marginLeft: "75px",
  },
  qrScanner: {
    width: "500px",
  },
}));

function Results({className, picklists, ...rest}) {
  const classes = useStyles();
  const [currentTab, setCurrentTab] = useState("all");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(sortOptions[0].value);
  const [showBagModal, setShowBagModal] = useState(false);
  const [currentPicklistObject, setCurrentPicklistObject] = useState({});
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    isProspect: null,
    isReturning: null,
    acceptsMarketing: null,
  });
  const {enqueueSnackbar} = useSnackbar();

  const handleTabsChange = (event, value) => {
    const updatedFilters = {
      ...filters,
      isProspect: null,
      isReturning: null,
      acceptsMarketing: null,
    };

    if (value !== "all") {
      updatedFilters[value] = true;
    }

    setFilters(updatedFilters);
    setSelected([]);
    setCurrentTab(value);
  };

  const handleQueryChange = (event) => {
    event.persist();
    setQuery(event.target.value);
  };

  const handleSortChange = (event) => {
    event.persist();
    setSort(event.target.value);
  };

  const handleSelectAll = (event) => {
    setSelected(event.target.checked ? picklists.map((obj) => obj.id) : []);
  };

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure delete the item?")) {
      selected.map((obj) => {
        // obj is id
        dispatch(deletePicklist(obj));
      });
    }
  };

  const handleSelectOne = (event, objId) => {
    if (!selected.includes(objId)) {
      setSelected((prevSelected) => [...prevSelected, objId]);
    } else {
      setSelected((prevSelected) => prevSelected.filter((id) => id !== objId));
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handleDelete = (obj) => {
    if (window.confirm("Are you sure delete the item?")) {
      dispatch(deletePicklist(obj.id));
    }
  };

  const handleCopy = (obj) => {
    navigator.clipboard.writeText(obj.url);
    enqueueSnackbar("Link has been copied.", {
      variant: "success",
    });
  };

  const updateIsPrinted = (obj) => {
    if (window.confirm("Are you sure to mark this picklist printed?")) {
      // dispatch(updatePicklistIsPrinted(obj.id));
    }
  };

  const handlePrint = (obj) => {
    setCurrentPicklistObject(obj);
    setShowBagModal(true);
  };

  const callPrinter = () => {
    printer(currentPicklistObject);
  };

  const handleClose = () => {
    setShowBagModal(false);
  };

  const handleComplete = (obj) => {
    let paginatedTemp = [];
    paginated.forEach((picklistItem) => {
      if (picklistItem.id === obj.id) {
        picklistItem.state = "Packed";
      }
      paginatedTemp.push(picklistItem);
    });
    setPaginated(paginatedTemp);
  };

  // Usually query is done on backend with indexing solutions
  const filtered = applyFilters(picklists, query, filters);
  const sorted = applySort(filtered, sort);
  const [paginated, setPaginated] = useState([]);
  const enableBulkOperations = selected.length > 0;
  const selectedSome = selected.length > 0 && selected.length < picklists.length;
  const selectedAll = selected.length === picklists.length;

  useEffect(() => {
    setPaginated(applyPagination(sorted, page, limit));
  }, []);

  // const captureWebcamRef = React.useRef(null);
  // const [captureImageSrc, setCaptureImageSrc] = useState(null);

  // const captureImage = useCallback(() => {
  //   const imgSrc = captureWebcamRef.current.getScreenshot();
  //   setCaptureImageSrc(imgSrc);
  // }, [captureWebcamRef, setCaptureImageSrc]);

  const [qrContent, setQrContent] = useState(null);

  const qrScannerScanHandler = (data) => {
    if (data) {
      setQrContent(data);
    }
  };

  return (
    <Card className={clsx(classes.root, className)} {...rest}>
      <Tabs
        onChange={handleTabsChange}
        scrollButtons="auto"
        textColor="secondary"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>
      <Divider />
      <Box p={2} minHeight={56} display="flex" alignItems="center">
        <TextField
          className={classes.queryField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon fontSize="small" color="action">
                  <SearchIcon />
                </SvgIcon>
              </InputAdornment>
            ),
          }}
          onChange={handleQueryChange}
          placeholder={
					intl.formatMessage({
					id: "PicklistListView-Results-7edad",
					defaultMessage: "Search picklists",
					description: ""
					})
          }
          value={query}
          variant="outlined"
        />
        <Box flexGrow={1} />
        <TextField
          label={
					intl.formatMessage({
					id: "PicklistListView-Results-00973",
					defaultMessage: "Sort By",
					description: ""
					})
          }
          name="sort"
          onChange={handleSortChange}
          select
          SelectProps={{native: true}}
          value={sort}
          variant="outlined"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </TextField>
      </Box>
      <TablePagination
        className={classes.header_pagination}
        component="div"
        count={filtered.length}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
      {enableBulkOperations && (
        <div className={classes.bulkOperations}>
          <div className={classes.bulkActions}>
            <Checkbox
              checked={selectedAll}
              indeterminate={selectedSome}
              onChange={handleSelectAll}
            />
            <Button
              variant="outlined"
              className={classes.bulkAction}
              onClick={handleDeleteAll}
            >
					{
					intl.formatMessage({
					id: "PicklistListView-Results-8b428",
					defaultMessage: "Delete",
					description: ""
					})
					}
            </Button>
          </div>
        </div>
      )}
      <PerfectScrollbar>
        <Box minWidth={700}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedAll}
                    indeterminate={selectedSome}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-7e0fc",
					defaultMessage: "Trade Order ID",
					description: ""
					})
					}
                  </TableCell>
                <TableCell>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-7e21b",
					defaultMessage: "State",
					description: ""
					})
					}
                  </TableCell>
                {/* <TableCell>Printed</TableCell> */}
                <TableCell align="center">
					{
					intl.formatMessage({
					id: "PicklistListView-Results-ecd0e",
					defaultMessage: "Actions",
					description: ""
					})
					}
                  </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((obj) => {
                const isSelected = selected.includes(obj.id);

                return (
                  <TableRow hover key={obj.id} selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(event) => handleSelectOne(event, obj.id)}
                        value={isSelected}
                      />
                    </TableCell>
                    <TableCell>{obj.trade_order_id}</TableCell>
                    <TableCell>{obj.state}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handlePrint(obj)}>
                        <SvgIcon fontSize="small">
                          <PrinterIcon />
                        </SvgIcon>
                      </IconButton>
                      <IconButton onClick={() => handleComplete(obj)}>
                        {/* <RouterLink to="/app/management/package"> */}
                        <SvgIcon fontSize="small">
                          <CheckIcon />
                        </SvgIcon>
                        {/* </RouterLink> */}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
      <TablePagination
        component="div"
        count={filtered.length}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <Dialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={showBagModal}
        className={classes.outsideDialog}
        fullWidth={true}
        maxWidth={"md"}
      >
        <div className={classes.dialogContainer}>
          <h1 id="form-dialog-title" className={classes.bigTitle}>
            Gói hàng cho Picklist PL-01-00001
          </h1>
          <p className={`${classes.smallMargin} ${classes.smallTitle}`}>
            1. Vui lòng cho các sản phẩm vào các túi riêng theo nhóm
          </p>
          <div className={classes.flexText}>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-ebc4f",
					defaultMessage: "Non Food",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-49684",
					defaultMessage: "Frozen",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-fff46",
					defaultMessage: "Chilled",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-ad860",
					defaultMessage: "Fragile",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-44d62",
					defaultMessage: "Liquid",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-7068d",
					defaultMessage: "Dry Food",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-34f0c",
					defaultMessage: "Fruit and Vegetable",
					description: ""
					})
					}
              </div>
            <div>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-b70f2",
					defaultMessage: "Other",
					description: ""
					})
					}
              </div>
          </div>
          <Divider className={classes.smallMargin} />
          <div className={classes.flexText}>
            <div className={classes.smallFlex}>
              <span>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-98067",
					defaultMessage: "Fragile",
					description: ""
					})
					}
                </span>
              <span>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-cf4e9",
					defaultMessage: "Dangerous",
					description: ""
					})
					}
                </span>
              <span>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-4fdb5",
					defaultMessage: "Liquid",
					description: ""
					})
					}
                </span>
            </div>
            <div className={classes.smallFlex}>
              <span>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-9d300",
					defaultMessage: "Ready To Eat",
					description: ""
					})
					}
                </span>
              <span>
					{
					intl.formatMessage({
					id: "PicklistListView-Results-d23bd",
					defaultMessage: "Non-RTE",
					description: ""
					})
					}
                </span>
            </div>
            <div className={classes.smallFlex}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
            <div className={classes.smallFlexInvi}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
            <div className={classes.smallFlexInvi}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
            <div className={classes.smallFlexInvi}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
            <div className={classes.smallFlexInvi}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
            <div className={classes.smallFlexInvi}>
              <span>Ready To Eat</span>
              <span>Non-RTE</span>
            </div>
          </div>
          <p className={`${classes.smallMargin} ${classes.smallTitle}`}>
            2. In nhãn và phân loại vào rổ
          </p>
          <div
            className={`${classes.smallMargin} ${classes.displayFlex} ${classes.alignCenter}`}
          >
            <div className={`${classes.pictureFrame}`}>
              <img
                className={classes.imageStyle}
                alt="barcode"
                src="https://www.clipartkey.com/mpngs/m/68-684611_barcode-laser-code-black-png-image-useless-barcode.png"
              ></img>
            </div>
            <div className={`${classes.smallFlex} ${classes.justifyCenter}`}>
              <ArrowRightAltIcon className={classes.bigIcon} />
            </div>
            <div
              className={`${classes.smallFlex} ${classes.smallPictureFrame} ${classes.justifyCenter}`}
            >
              <img
                className={classes.imageStyle}
                alt="box-icon"
                src="https://image.flaticon.com/icons/svg/31/31821.svg"
              ></img>
            </div>
            <div className={classes.smallFlex}>
              <h3>Rổ 1:</h3>
              <h1>Chờ gộp kiện ngay</h1>
            </div>
          </div>
          <Button
            variant="contained"
            color="primary"
            className={classes.marginLeft}
            onClick={() => callPrinter()}
          >
					{
					intl.formatMessage({
					id: "PicklistListView-Results-4fabe",
					defaultMessage: "Print label",
					description: ""
					})
					}
          </Button>
        </div>
      </Dialog>
      {/* <Webcam
        width={500}
        height={500}
        screenshotFormat="image/jpeg"
        ref={captureWebcamRef}
      />
      <Button onClick={captureImage}>Capture</Button> */}
      {/* <QrReader
        delay={0}
        onError={qrScannerErrorHandler}
        onScan={qrScannerScanHandler}
        className={classes.qrScanner}
      />
      <p>{qrContent}</p> */}
    </Card>
  );
}

Results.propTypes = {
  className: PropTypes.string,
  picklists: PropTypes.array,
};

Results.defaultProps = {
  picklists: [],
};

export default Results;
