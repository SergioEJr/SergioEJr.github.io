---
title: "An introduction to maximum likelihood estimation"
description: "Finding the distribution parameters that make the observed data most probable."
pubDate: "2022-10-27"
category: notebook
topic: Probability and Statistics
authors:
  - sergio-eraso
keywords:
  - statistical inference
  - parameter estimation
  - machine learning
draft: true # set to true to unpublish
---
Let's say we have a random variable $X$ that follows a distribution $p(x; \theta)$, where $\theta$ are the parameters of the distribution. In *probability*, we are given the parameters of the distribution a priori and are then tasked to answer various questions about $X$, such as what its mean or variance are, or how likely we are to observe $X > 5$. However, very often, we instead already have many observations of a random variable (a data set) and also have an idea of the underlying distribution, but not of its parameters. For example, if we know our data comes from a Gaussian distribution, then there is an infinite family of distributions that our data could have come from, corresponding to the infinite possible combinations of the mean $\mu$ and variance $\sigma^2$. Our task is then to choose the parameters that best describe our data. This is the goal of maximum likelihood estimation, a method in *inferential statistics*.
## Maximum likelihood estimation

Given a set of i.i.d. data $D = \{x_1, x_2, \ldots, x_n\}$ with known distribution $X_i \sim p(x,\theta)$ but unknown distribution parameters $\theta$, we would like to find an estimate of the parameters that maximizes the probability of observing our data, denoted $\hat{\theta}$. Since each data point is independent, a natural choice of function to maximize is the sampling distribution of our data $P$, but seen as a function of $\theta$,
$$
P(D \mid \theta) = L(\theta \mid D) = \prod_i p(x_i; \theta).
$$
This function is called the **likelihood** — it can be understood as the joint probability 
of observing all points in $D$ given that $X_i \sim p$ with parameters $\theta$. In practice, since probabilities are numbers less than one, the product can get small very fast. Thus, we usually work with the **log-likelihood**
$$
\ell(\theta \mid D) = \log L = \sum_i \log p(x_i; \theta).
$$
Since log is monotonically increasing, the $\theta$ that maximizes $L$ also maximizes $\ell$. This maximizing parameter vector $\hat{\theta}$ is called the **maximum likelihood estimate** (MLE). It is formally defined as
$$
\hat{\theta} = \operatorname*{argmax}_\theta \ell.
$$

### Example: Unfair coin

Suppose we have an unfair coin that has a probability $\theta$ to come out
heads, unknown to us. If we toss the coin $N$ times and observe $n$ heads, what
would you estimate $\theta$ to be? With the information at hand, it is natural
to guess that 

$$
\hat{\theta}_{\text{guess}} = \frac{n}{N}
$$

is an approximation for the true parameter $\theta$. Let's systematically 
obtain this result from MLE. The likelihood function is,
$$
\begin{gather*}
L(\theta) = \theta^n \theta^{N-n}
  \\
\ell(\theta) =  n \log \theta + (N-n)\log (1 - \theta)
\end{gather*}
$$
Extremizing the log-likelihood yields a parameter estimate 
that confirms our intuition,
$$
\hat{\theta}_{\text{MLE}} = \hat{\theta}_{\text{guess}} = \frac{n}{N}.
$$
We can see that for a fair coin, if we have enough trials, then the estimated parameter will be close to $1/2$, while for an unfair coin, the estimated parameter will approach the true parameter due to the law of large numbers. 

But what if we have very few trials? Say we get heads three times on a coin we know is slightly unfair. Then, $\hat{\theta}_{\text{MLE}} = 1$ -- MLE predicts that we will never land on tails from three flips. 

## Maximum a posteriori estimation

If we have some prior knowledge of the distribution of $\theta$, 
some $f(\theta)$, we would like to incorporate this into our estimate 
for $\hat{\theta}$ given the data $D$. We can use Bayes' rule to accomplish this.
$$
\begin{align}
	\underbrace{P(\theta \mid D)}_{\text{posterior}} 
	\propto \overbrace{P(D \mid \theta)}^{\text{likelihood}} 
	\overbrace{f(\theta)}^{\text{prior}}
\end{align}
$$
Thus, we can maximize the probability of $\theta$ given $D$ by calculating
$$
\begin{align}
	\hat{\theta}_{\text{MAP}} 
	= \operatorname*{argmax}_{\theta} P(\theta \mid D) 
	= \operatorname*{argmax}_{\theta} P(D \mid \theta) f(\theta)
\end{align}
$$
Since $ \log $ is monotonically increasing, we can take the log of $ P(D\mid \theta)f(\theta) $ and use the definition of the log-likelihood from before to get
$$
\begin{align}
	\hat{\theta}_{\text{MAP}} &= \operatorname*{argmax}_{\theta}\left( 
	\sum_i \log p(x_i; \theta) + \log f(\theta)\right)
\end{align}
$$
If we have no prior knowledge about $\theta$, which is to say that  $f(\theta)$ is a uniform distribution, then $f(\theta) = \text{constant}$ and it follows that $\hat{\theta}_{\text{MAP}} = \hat{\theta}_{\text{MLE}}$. Therefore, MLE can be seen as a special case of MAP where our prior distribution is uniform.
