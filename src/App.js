import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import Axios from 'axios';

const axios = Axios.create({
  baseURL: 'http://localhost:8000/',
});



const styles = theme => ({
  root: {
    paddingBottom: 60,
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    padding: 12,
    width: "100vw",
    boxSizing: "border-box",
  },
  backButton: {

  },
  formControl: {
    width: "100%",
    display: "block"
  },
  nextButton: {
    float: "right",
  },
  stepTitle: {
    marginBottom: theme.spacing.unit * 3,
  }
});

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {  location: [51.923377, 4.469013],
                    zoom: 13,
                    accuracy: 100,
                    currentStep: 0,
                    buildingType: "house",
                    occupants: 1,
                    username: "",
                    password: "",
                    phrase: "",
                 }
    this.refmarker = React.createRef();
    navigator.geolocation.getCurrentPosition((pos) => {
      this.setState({location: [pos.coords.latitude, pos.coords.longitude]});
    });

    this.updatePosition = this.updatePosition.bind(this);

    axios.get('/oehu/getConfigurated').then( result => {
        if(result.data.configurated) { //if configurated go to dashboard
           axios.get('/oehu/getConfig').then( result => {
              window.location = "https://oehu.org/dashboard/" + result.data.deviceID;
           });
           return;
        }
        else{
           this.generatePhrase();
        }
    });


  }



  async generatePhrase() {
    let result = await axios.get('/oehu/generateNewPhrase');

    if(!result.data.success) {
      alert("Can not configure at this time", result);
    }

    result = await axios.get('/oehu/getconfig');

    this.setState({phrase: result.data.phrase});

  }

  getSteps() {
      return ['Location', 'Building data', 'Credentials', 'Backup', 'Dashboard'];
  }

  updatePosition() {
      const { lat, lng } = this.refmarker.current.leafletElement.getLatLng();
      this.setState({
          marker: { lat, lng },
      })
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleDeviceRegister = async () => {
    if(this.state.currentStep == this.getSteps().length - 1) { //if on last step register device
        let result = await axios.get('/oehu/registerDevice/OEHU/' + this.state.location[0] + '/' + this.state.location[1] + '/' + this.state.accuracy + '/' + this.state.buildingType + '/' + this.state.occupants);
        // await register to website api thingy
        if(result.data.deviceID /* && otherresult */ ) {
          window.location = "https://oehu.org/dashboard/" + result.data.deviceID;
        }
    }
  }

  handleNextStep = async (event) => {
    await this.setState({currentStep: this.state.currentStep + 1});
    this.handleDeviceRegister();
  }

  handleBackStep = (event) => {
    this.setState({currentStep: this.state.currentStep - 1});
  }

  render() {
    const {classes} = this.props;
    const steps = this.getSteps();

    return (
      <div className={classes.root} >
      <Stepper activeStep={this.state.currentStep}>
        {steps.map((label, index) => {
          return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
          );
        })}
      </Stepper>
          <Grid container style={{overflow: "hidden", padding: 32}} spacing={38} justify="center">
              {this.state.currentStep == 0 &&
                <Grid item xs={12}>
                    <Typography variant="headline" gutterBottom>
                      Where is your OEHU device?
                    </Typography>

                    <Map center={this.state.location} zoom={this.state.zoom} style={{width: "100%", height: 400, overflow: "hidden"}}>
                      <TileLayer
                        attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker ref={this.refmarker} position={this.state.location} draggable={true} onDragend={this.updatePosition} />

                    </Map>

                    <TextField
                        id="standard-name"
                        label="Location Accuracy"
                        value={this.state.accuracy}
                        InputProps={{endAdornment: <InputAdornment position="end">meters</InputAdornment>}}
                        helperText="How accurate do you want your location to be known to the public?"
                        onChange={this.handleChange('accuracy')}
                        type="number"
                        margin="normal"
                    />
                </Grid>
              }

              {this.state.currentStep == 1 &&
                <Grid item xs={6}>
                    <Typography className={classes.stepTitle} variant="headline" align="center" gutterBottom>
                      Can you tell me a little bit about the building?
                    </Typography>


                    <FormControl className={classes.formControl}>
                      <InputLabel htmlFor="age-simple">Building Type</InputLabel>
                      <Select
                        style={{width: "100%"}}
                        value={this.state.buildingType}
                        onChange={this.handleChange}
                        inputProps={{
                          name: 'building-type',
                          id: 'building-type',
                        }}
                      >

                        <MenuItem value={"house"}>House</MenuItem>
                        <MenuItem value={"office"}>Office</MenuItem>
                        <MenuItem value={"storage"}>Storage</MenuItem>
                        <MenuItem value={"factory"}>Factory</MenuItem>

                      </Select>
                    </FormControl>
                      <TextField
                          id="standard-name"
                          label="Occupants"
                          value={this.state.occupants}
                          InputProps={{endAdornment: <InputAdornment position="end">people</InputAdornment>, style:{width: "100%"}}}
                          helperText=""
                          onChange={this.handleChange('occupants')}
                          type="number"
                          margin="normal"
                          className={classes.formControl}
                      />
                </Grid>
              }

              {this.state.currentStep == 2 &&
                <Grid item xs={6}>
                    <Typography className={classes.stepTitle} variant="headline" align="center" gutterBottom>
                        What would you like your username and password to be?
                    </Typography>

                    <TextField
                        id="standard-name"
                        label="Username"
                        value={this.state.username}
                        helperText=""
                        InputProps={{style:{width: "100%"}}}
                        onChange={this.handleChange('username')}
                        margin="normal"
                        className={classes.formControl}
                    />
                    <TextField
                        id="standard-name"
                        label="Password"
                        value={this.state.password}
                        helperText=""
                        InputProps={{style:{width: "100%"}}}
                        onChange={this.handleChange('password')}
                        type="password"
                        margin="normal"
                        className={classes.formControl}
                    />
                </Grid>
              }

              {this.state.currentStep == 3 &&
                <Grid item xs={6}>
                    <Typography className={classes.stepTitle} variant="headline" align="center" gutterBottom>
                       Please write down the data below
                    </Typography>

                    <TextField
                        id="standard-name"
                        label="Phrase"
                        value={this.state.phrase}
                        disabled
                        helperText=""
                        InputProps={{style:{width: "100%"}}}
                        margin="normal"
                        className={classes.formControl}
                    />
                    <TextField
                        id="standard-name"
                        label="Username"
                        value={this.state.username}
                        helperText=""
                        InputProps={{style:{width: "100%"}}}
                        disabled
                        margin="normal"
                        className={classes.formControl}
                    />
                    <TextField
                        id="standard-name"
                        label="Password"
                        value={this.state.password}
                        helperText=""
                        InputProps={{style:{width: "100%"}}}
                        disabled
                        margin="normal"
                        className={classes.formControl}
                    />
                </Grid>
              }
              {this.state.currentStep == 4 &&
                <Grid item xs={6}>
                    <Typography className={classes.stepTitle} variant="headline" align="center" gutterBottom>
                       Please wait while we register your OEHU device to the network.
                    </Typography>
                    <Typography gutterBottom noWrap align="center">
                      {`
                        Please do not refresh the page. Once its done you will get redirected to your dashboard
                      `}
                    </Typography>
                </Grid>
              }
          </Grid>

          <div className={classes.bottomBar}>
              {this.state.currentStep !== 0 && <Button onClick={this.handleBackStep}  size="large" variant="outlined" color="default" className={classes.backButton}>
                  Back
              </Button>}
              <Button size="large" onClick={this.handleNextStep} variant="outlined" color="primary" className={classes.nextButton}>
                  Next
              </Button>
          </div>

      </div>
    );
  }
}

export default withStyles(styles)(App);
