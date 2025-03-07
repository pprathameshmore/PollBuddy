import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
import { MDBContainer } from "mdbreact";
import "mdbreact/dist/css/mdb.css";
import LoadingWheel from "../../components/LoadingWheel/LoadingWheel";
import {withRouter} from "../../components/PropsWrapper/PropsWrapper";
import QuestionResults from "../../components/QuestionResults/QuestionResults";
import "./PollResults.scss";

class PollResults extends Component {
  constructor() {
    super();
    this.state = {
      error: null,
      doneLoading: false,
      questions: {},
      currentQuestion: 0,
      dataBar: {
        labels: [],
        datasets: [
          {
            label: "Number of Votes",
            data: [],
            backgroundColor: [
              "rgba(255, 134, 159, 0.5)", // TODO: These need to be generated in some way
              "rgba(98,  182, 239, 0.5)", // Probably through the backend tbh so the poll admin can pick the colors
              "rgba(255, 218, 128, 0.5)", // But also make a random generator so they don't have to
              "rgba(113, 205, 205, 0.5)",
              "rgba(170, 128, 252, 0.5)",
              "rgba(255, 134, 159, 0.5)",
              "rgba(98,  182, 239, 0.5)",
              "rgba(255, 218, 128, 0.5)",
              "rgba(113, 205, 205, 0.5)",
              "rgba(170, 128, 252, 0.5)",
            ],
            borderWidth: 5,
            borderColor: [
              "rgba(255, 134, 159, 1)",
              "rgba(98,  182, 239, 1)",
              "rgba(255, 218, 128, 1)",
              "rgba(113, 205, 205, 1)",
              "rgba(170, 128, 252, 1)",
              "rgba(255, 134, 159, 1)",
              "rgba(98,  182, 239, 1)",
              "rgba(255, 218, 128, 1)",
              "rgba(113, 205, 205, 1)",
              "rgba(170, 128, 252, 1)",
            ]
          }
        ]
      },
      barChartOptions: {
        legend: {display: false},
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          xAxes: [
            {
              barPercentage: 1,
              gridLines: {
                gridLines: {
                  display: true,
                  color: "rgba(255, 255, 255, 0.9)"
                }
              },
              ticks: {
                fontColor: "white",
                fontSize: 20,
                fontFamily: "Baloo 2",
              }
            }
          ],
          yAxes: [
            {
              gridLines: {
                display: true,
                color: "rgba(255, 255, 255, 0.9)"
              },
              ticks: {
                beginAtZero: true,
                fontColor: "white",
                fontSize: 20,
                fontFamily: "Baloo 2",
                precision: 0
              }
            }
          ]
        }
      }
    };
  }

  componentDidMount() {
    this.props.updateTitle("Poll Results");
    fetch(process.env.REACT_APP_BACKEND_URL + "/polls/" + this.props.router.params.pollID + "/results", {
      method: "GET"
    })
      .then(response => response.json())
      .then(response => {
        if (response.result === "success") {
          this.setState({
            doneLoading: true,
            questions: response.data.questions,
          });
        } else {
          this.setState({
            showError: true,
          });
          for(let i = 0; i < this.state.questionData.CorrectAnswers.length-1; i++){
            this.setState({correctAnswers : this.state.correctAnswers + this.state.questionData.CorrectAnswers[i] + ", "});
          }
          this.setState({correctAnswers: this.state.correctAnswers + this.state.questionData.CorrectAnswers[this.state.questionData.CorrectAnswers.length-1]});
          this.setState({"doneLoading": true});
        }
      });
  }

  displayQuestion = (index) => {
    this.setState({
      currentQuestion: index,
    });
  };

  render() {
    if (this.state.showError) {
      return (
        <MDBContainer fluid className="page">
          <MDBContainer fluid className="box">
            <p className="fontSizeLarge">
              Error loading data! Please try again.
            </p>
          </MDBContainer>
        </MDBContainer>
      );
    } else if (!this.state.doneLoading) {
      return (
        <MDBContainer className="page">
          <LoadingWheel/>
        </MDBContainer>
      );
    } else {
      return (
        <MDBContainer fluid className="page">
          <div className="questions-bar">
            {this.state.questions.map((question, index) => {
              return (
                <div>
                  <div className={
                    this.state.currentQuestion === index ?
                      "question-label question-label-active" :
                      "question-label question-label-inactive"
                  } onClick={() => this.displayQuestion(index)}>
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          {this.state.questions.map((question, index) => {
            if (this.state.currentQuestion === index) {
              return (
                <QuestionResults data={{
                  questionNumber: this.state.currentQuestion + 1,
                  question: this.state.questions[this.state.currentQuestion],
                }}/>
              );
            }
          })}
        </MDBContainer>
      );
    }
  }
}

export default withRouter(PollResults);