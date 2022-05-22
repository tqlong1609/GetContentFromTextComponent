import React from "react";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import clsx from "clsx";
import {
  Breadcrumbs,
  Button,
  Grid,
  Link,
  SvgIcon,
  Typography,
  makeStyles,
} from "@material-ui/core";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import { PlusCircle as PlusCircleIcon } from "react-feather";

const useStyles = makeStyles((theme) => ({
  root: {},
  action: {
    marginBottom: theme.spacing(1),
    "& + &": {
      marginLeft: theme.spacing(1),
    },
  },
  actionIcon: {
    marginRight: theme.spacing(1),
  },
}));

function Header({ className, ...rest }) {
  const classes = useStyles();

  return (
    <Grid
      className={clsx(classes.root, className)}
      container
      justify="space-between"
      spacing={3}
      {...rest}
    >
      <Grid item>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link variant="body1" color="inherit" to="/" component={RouterLink}>
            {intl.formatMessage({
              id: "PicklistListView-Header-e273d",
              defaultMessage: "Home",
              description: "",
            })}
          </Link>
          <Link
            variant="body1"
            color="inherit"
            to="/app/content/item-management"
            component={RouterLink}
          >
            {intl.formatMessage({
              id: "PicklistListView-Header-a502b",
              defaultMessage: "Content",
              description: "",
            })}
          </Link>
          <Typography variant="body1" color="textPrimary">
            {intl.formatMessage({
              id: "PicklistListView-Header-c445e",
              defaultMessage: "Picklist",
              description: "",
            })}
          </Typography>
        </Breadcrumbs>
        <Typography variant="h3" color="textPrimary">
          {intl.formatMessage({
            id: "PicklistListView-Header-37a9c",
            defaultMessage: "All Picklist",
            description: "",
          })}
        </Typography>
      </Grid>
      {/* <Grid item>
        <Link to="/app/content/media/create" component={RouterLink}>
          <Button
            color="secondary"
            variant="contained"
            className={classes.action}
          >
            <SvgIcon fontSize="small" className={classes.actionIcon}>
              <PlusCircleIcon />
            </SvgIcon>
            New Media
          </Button>
        </Link>
      </Grid> */}
    </Grid>
  );
}

Header.propTypes = {
  className: PropTypes.string,
};

export default Header;
